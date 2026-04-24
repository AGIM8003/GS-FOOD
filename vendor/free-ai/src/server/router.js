import { loadL1 } from '../cache/l1.js';
import fs from 'fs';
import path from 'path';
import tracing from '../tracing/index.js';
import { ProviderRegistry } from '../providers/registry.js';
import { computeProviderLadder } from '../providers/ladder.js';
import { recordUsage, snapshotFor } from '../providers/budgetGuardian.js';
import { writeDecisionGraph } from '../control/decisionGraph.js';
import { resolveAdaptiveCapabilities } from '../capability/acquisition.js';
import { translateIntent } from '../cognitive/translator.js';
import { buildContext } from '../cognitive/contextEngine.js';
import { runReasoning } from '../cognitive/reasoning.js';
import { loadSkillsForRequest } from '../cognitive/skillLoader.js';
import { compilePromptRuntime } from '../prompt/runtime.js';
import { parseAndValidateOutput, tryRepairJson } from '../prompt/contracts.js';
import { enforceQualityGates } from '../prompt/gates.js';
import { buildProviderResponseFormat } from '../prompt/providerFormat.js';
import { makeReceipt } from '../receipts.js';
import { selectPersona } from '../persona/registry.js';
import { orchestrateSkills } from '../skill/orchestrator.js';
import { runMetacognition } from '../metacog/index.js';
import { queryMemory, writeMemory } from '../memory/vault.js';
import { tracer } from '../telemetry/tracer.js';
import { observeInteraction } from '../training/observer.js';

function mergeSkills(primary = [], secondary = []) {
  const seen = new Set();
  return [...primary, ...secondary].filter((skill) => {
    const id = skill?.id;
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export class Router {
  constructor(cfg) {
    this.cfg = cfg;
    this.cache = loadL1(cfg.root);
    this.registry = new ProviderRegistry(cfg);
  }

  async handleRequest(payload) {
    const start = Date.now();
    const trace_id = `t-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const span = tracing.startSpan('router.handleRequest', { trace_id, prompt: payload?.prompt?.slice?.(0,200) });
    const telemetrySpan = tracer.startSpan('gen_ai.request', {
      traceId: trace_id,
      attributes: {
        'gen_ai.operation.name': 'infer',
        'freeai.route': '/v1/infer',
        'freeai.prompt.length': payload?.prompt?.length || 0,
      },
    });

    // Gate
    if (!payload || !payload.prompt) {
      telemetrySpan.setError('prompt required').end({ 'http.status_code': 400 });
      return { status: 400, error: 'prompt required' };
    }

    // Translator -> Intent + structured translation
    const translatorOut = await translateIntent(payload.prompt);
    tracing.addEvent(span, 'translator.complete', { intent_family: translatorOut.intent_family });
    telemetrySpan
      .setAttribute('freeai.intent.family', translatorOut.intent_family || 'unknown')
      .addEvent('translator.complete', { intent_family: translatorOut.intent_family || 'unknown' });
    const intent = translatorOut; // canonical name used across pipeline

    // Memory retrieval (short-term hooks)
    const memoryHits = await queryMemory({ subject: translatorOut.raw, limit: 3 }).catch(()=>[]);

    // Build context snapshot from translator + memory
    const context = await buildContext({ translatorOutput: translatorOut, memoryHits, prevContext: null });

    // Reasoning pass
    const reasoning = await runReasoning({ translatorOutput: translatorOut, contextSnapshot: context, memoryHits });
    tracing.addEvent(span, 'reasoning.complete', { strategy: reasoning?.reasoning_mode });

    // Metacognition -> persona hint and memory write candidate
    const meta = runMetacognition({ prompt: payload.prompt, intent: translatorOut, persona: null, skills: [], memoryHits });

    // Persona selection (supports override via payload.persona)
    const personaResult = await selectPersona({ intent: translatorOut, memoryHits, override: payload.persona, context, reasoning });
    let persona = personaResult.persona;
    tracing.addEvent(span, 'persona.selected', { persona: persona?.id || null, confidence: personaResult.confidence || null });

    // Skill orchestration: mount skills dynamically based on intent, persona and reasoning
    const skillsResult = await orchestrateSkills({ intent: translatorOut, persona, memoryHits, maxSkills: 5, context, reasoning });
    let skills = Array.isArray(skillsResult) ? skillsResult : (skillsResult && skillsResult.mounted_skills ? skillsResult.mounted_skills : []);
    tracing.addEvent(span, 'skills.mounted', { count: skills.length, skills: skills.map(s=> s.id) });

    const adaptive = await resolveAdaptiveCapabilities({ prompt: payload.prompt, payload, intent: translatorOut, context, reasoning, personaResult, skills });
    const effectivePersonaResult = adaptive.personaResult || personaResult;
    persona = effectivePersonaResult.persona || persona;
    skills = adaptive.skills || skills;
    tracing.addEvent(span, 'capabilities.resolved', {
      persona: persona?.id || null,
      skill_count: skills.length,
      adaptive_activated: !!adaptive.report?.activated_now,
    });

    // Cache key
    const cacheKey = `${hashPrompt(payload.prompt)}|${persona.id}|${persona.version}|${skills.map(s=>s.id).join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const receipt = makeReceipt({provider_id: 'local-cache', model_id: 'l1', http_status: 200, fallback_used: false, kb_short_circuit: true, persona, intent, skills, trace_id, latency_ms: Date.now()-start});
      receipt.capability_acquisition = adaptive.report;
      receipt.training = await observeInteraction({ payload, intent: translatorOut, context, reasoning, persona, skills, receipt, adaptiveReport: adaptive.report, previewOnly: false }).catch(() => ({ recorded: false }));
      telemetrySpan.end({
        'gen_ai.response.provider': 'local-cache',
        'http.status_code': 200,
        'freeai.cache.hit': true,
      });
      return { status: 200, body: cached, receipt };
    }

    // Prompt compile
    const promptRuntime = await compilePromptRuntime({ prompt: payload.prompt, persona, skills, intent, contextSnapshot: context, reasoning, trace_id, payload });
    const compiled = promptRuntime.compiled_prompt;

    if (payload.preview_only) {
      const receipt = makeReceipt({ provider_id: 'preview', model_id: null, http_status: 200, fallback_used: false, kb_short_circuit: false, persona, intent, skills, trace_id, latency_ms: Date.now()-start, selected_prompt_variant: promptRuntime.metadata.prompt_variant, selected_output_contract: promptRuntime.output_contract.id, prompt_metadata: promptRuntime.metadata });
      receipt.capability_acquisition = adaptive.report;
      receipt.training = await observeInteraction({ payload, intent: translatorOut, context, reasoning, persona, skills, receipt, adaptiveReport: adaptive.report, previewOnly: true }).catch(() => ({ recorded: false }));
      tracing.endSpan(span, { status: 'preview', latency_ms: Date.now()-start });
      telemetrySpan.end({
        'gen_ai.response.provider': 'preview',
        'http.status_code': 200,
        'freeai.preview_only': true,
      });
      return { status: 200, body: { compiled_prompt: compiled, metadata: promptRuntime.metadata, output_contract: promptRuntime.output_contract }, receipt };
    }

    // Router -> providers (non-stream)
    // compute provider ladder decision for observability and routing hints
    const ladderDecision = computeProviderLadder(this.registry.providers, { persona, intent, skills, outputContractId: promptRuntime.output_contract.id });
    try{ const ed = path.join(process.cwd(),'evidence','providers'); if (!fs.existsSync(ed)) fs.mkdirSync(ed, { recursive: true }); fs.writeFileSync(path.join(ed, `route-${Date.now()}.json`), JSON.stringify({ ladderDecision, persona: persona?.id||null, intent: intent?.intent_family||null, skills: skills.map(s=>s.id) }, null, 2)); }catch(e){}

    const responseFormat = ladderDecision?.chosen_provider ? buildProviderResponseFormat(ladderDecision.chosen_provider, promptRuntime.output_contract) : null;
    let providerResp = await this.registry.callProviders(compiled, { persona, intent, skills, trace_id, ladderDecision, response_contract_id: promptRuntime.output_contract.id, response_contract: promptRuntime.output_contract, response_format: responseFormat }, { timeout: payload.timeout || 15000 });

    // On success
    if (providerResp && providerResp.ok) {
      let validation = enforceQualityGates(providerResp.output, promptRuntime.output_contract, {
          repair_attempts: payload._repairAttempted ? 1 : 0,
          memory_candidates: meta?.metacog?.memory_write_candidate ? [meta.metacog.memory_write_candidate] : []
      });
      if (!validation.valid && promptRuntime.output_contract.type === 'json') {
        const repaired = tryRepairJson(providerResp.output);
        if (repaired !== null) {
          validation = enforceQualityGates(JSON.stringify(repaired), promptRuntime.output_contract, {
              repair_attempts: payload._repairAttempted ? 1 : 0,
              memory_candidates: meta?.metacog?.memory_write_candidate ? [meta.metacog.memory_write_candidate] : []
          });
        }
      }
      if (!validation.valid && promptRuntime.output_contract.type === 'json' && !payload._repairAttempted) {
        // Swap to the next best provider in the ladder if possible to avoid duplicating the same error
        const backupProvider = ladderDecision.ranked?.primary_free?.[1]?.id || ladderDecision.ranked?.burst_free?.[0]?.id || null;
        if (backupProvider && backupProvider !== ladderDecision.chosen_provider) {
            ladderDecision.chosen_provider = backupProvider;
        }

        const repairPrompt = `${compiled}\n\nREPAIR: Return only valid JSON that satisfies the requested contract. No markdown, no prose. Fix these errors: ${JSON.stringify(validation.errors)}`;
        providerResp = await this.registry.callProviders(repairPrompt, { persona, intent, skills, trace_id, ladderDecision, response_contract_id: promptRuntime.output_contract.id, response_contract: promptRuntime.output_contract, response_format: responseFormat }, { timeout: payload.timeout || 15000, maxAttemptsPerProvider: 1 });
        if (providerResp && providerResp.ok) {
           validation = enforceQualityGates(providerResp.output, promptRuntime.output_contract, {
              repair_attempts: 1,
              memory_candidates: meta?.metacog?.memory_write_candidate ? [meta.metacog.memory_write_candidate] : []
           });
        }
      }
      // cache L1
      this.cache.set(cacheKey, providerResp.output);
      const receipt = makeReceipt({ ...providerResp.receipt, trace_id, latency_ms: Date.now()-start, selected_prompt_variant: promptRuntime.metadata.prompt_variant, selected_output_contract: promptRuntime.output_contract.id, output_validation: validation, prompt_metadata: promptRuntime.metadata });
      // attach persona and metacog info
      receipt.persona_selected = { final_persona_id: effectivePersonaResult.final_persona_id || persona.id || persona.name, persona_version: effectivePersonaResult.persona_version || persona.version || 'v1', blend_weights: effectivePersonaResult.blend_weights || null, confidence: effectivePersonaResult.confidence || null, source: effectivePersonaResult.source || null, rationale_codes: effectivePersonaResult.rationale_codes || [] };
      receipt.metacognition = meta.metacog;
      receipt.skills_loaded = skills.map(s=> ({ id: s.id, version: s.version || 'v1' }));
      receipt.route_decision = ladderDecision;
      receipt.capability_acquisition = adaptive.report;
      receipt.training = await observeInteraction({ payload, intent: translatorOut, context, reasoning, persona, skills, receipt, adaptiveReport: adaptive.report, previewOnly: false }).catch(() => ({ recorded: false }));
      // memory write suggestion
      if (meta.metacog.memory_write_candidate) {
        const mem = await writeMemory({ ...meta.metacog.memory_write_candidate, source_trace_id: trace_id, importance: 0.6, version: 'v1' });
        receipt.memory_written = { memory_id: mem.memory_id };
      }
      receipt.decision_graph = writeDecisionGraph({
        trace_id,
        prompt_variant: promptRuntime.metadata.prompt_variant,
        prompt_family_id: promptRuntime.metadata.prompt_family_id,
        output_contract: promptRuntime.output_contract.id,
        provider_id: receipt.provider_id,
        model_id: receipt.model_id,
        fallback_used: false,
        translator: { intent_family: translatorOut.intent_family, task_type: translatorOut.task_type },
        context: { domain: context?.domain || null, continuity_score: context?.continuity_score ?? null },
        reasoning: { mode: reasoning?.reasoning_mode || null, strategy_type: reasoning?.strategy_type || null, confidence: reasoning?.confidence ?? null },
        persona: { id: persona?.id || null, confidence: effectivePersonaResult.confidence ?? null },
        skills: skills.map((skill) => ({ id: skill.id, version: skill.version || 'v1' })),
        memory_hits: memoryHits.map((hit) => ({ memory_id: hit.memory_id, category: hit.category, subject: hit.subject })),
        route_decision: ladderDecision,
        validation: { valid: validation.valid, repaired: validation.repaired, errors: validation.errors },
      });
      // record usage snapshot for provider chosen
      try{ if (receipt && receipt.provider_id) recordUsage(receipt.provider_id, { requests:1, tokens: receipt.usage ? (receipt.usage.total_tokens||0) : 0, status: receipt.http_status || 200, latency: receipt.latency_ms || 0 }); }catch(e){}
      tracing.endSpan(span, { status: 'ok', provider: receipt.provider_id, latency_ms: Date.now()-start });
      telemetrySpan.end({
        'gen_ai.response.provider': receipt.provider_id || 'unknown',
        'gen_ai.response.model': receipt.model_id || 'unknown',
        'http.status_code': 200,
        'freeai.output.valid': validation.valid,
      });
      return { status: 200, body: validation.valid && promptRuntime.output_contract.type === 'json' ? validation.parsed : providerResp.output, receipt };
    }

    // Exhausted providers -> local KB fallback
    const kb = await import('../localkb.js');
    const fallback = kb.answerFallback(payload.prompt, { includeDiagnostics: true });
    const localQuota = snapshotFor('ollama');
    const receipt = makeReceipt({ provider_id: 'none', model_id: null, http_status: 503, fallback_used: true, kb_short_circuit: false, persona, intent, skills, trace_id, latency_ms: Date.now()-start, selected_prompt_variant: promptRuntime.metadata.prompt_variant, selected_output_contract: promptRuntime.output_contract.id, route_decision: ladderDecision, local_survival_used: true, quota_snapshot: localQuota });
    receipt.persona_selected = { final_persona_id: effectivePersonaResult.final_persona_id || persona.id || persona.name, persona_version: effectivePersonaResult.persona_version || persona.version || 'v1', blend_weights: effectivePersonaResult.blend_weights || null, confidence: effectivePersonaResult.confidence || null, source: effectivePersonaResult.source || null, rationale_codes: effectivePersonaResult.rationale_codes || [] };
    receipt.metacognition = meta.metacog;
    receipt.skills_loaded = skills.map(s=> ({ id: s.id, version: s.version || 'v1' }));
    receipt.capability_acquisition = adaptive.report;
    receipt.training = await observeInteraction({ payload, intent: translatorOut, context, reasoning, persona, skills, receipt, adaptiveReport: adaptive.report, previewOnly: false }).catch(() => ({ recorded: false }));
    receipt.local_retrieval = fallback.diagnostics;
    // attach failureChain if present
    if (providerResp && providerResp.failureChain) receipt.failure_chain = providerResp.failureChain;
    receipt.decision_graph = writeDecisionGraph({
      trace_id,
      prompt_variant: promptRuntime.metadata.prompt_variant,
      prompt_family_id: promptRuntime.metadata.prompt_family_id,
      output_contract: promptRuntime.output_contract.id,
      provider_id: null,
      model_id: null,
      fallback_used: true,
      translator: { intent_family: translatorOut.intent_family, task_type: translatorOut.task_type },
      context: { domain: context?.domain || null, continuity_score: context?.continuity_score ?? null },
      reasoning: { mode: reasoning?.reasoning_mode || null, strategy_type: reasoning?.strategy_type || null, confidence: reasoning?.confidence ?? null },
      persona: { id: persona?.id || null, confidence: effectivePersonaResult.confidence ?? null },
      skills: skills.map((skill) => ({ id: skill.id, version: skill.version || 'v1' })),
      memory_hits: memoryHits.map((hit) => ({ memory_id: hit.memory_id, category: hit.category, subject: hit.subject })),
      route_decision: ladderDecision,
      validation: null,
    });
    tracing.endSpan(span, { status: 'fallback', reason: 'providers_exhausted' });
    telemetrySpan.end({
      'gen_ai.response.provider': 'local_kb_fallback',
      'http.status_code': 200,
      'freeai.fallback_used': true,
      'freeai.retrieval.action': fallback.diagnostics?.retrieval?.action || 'incorrect',
      'freeai.retrieval.overall_score': fallback.diagnostics?.evaluation?.overall_score || 0,
    });
    return { status: 200, body: fallback.answer, receipt };
  }

  async handleRequestStream(payload, res) {
    const start = Date.now();
    const trace_id = `t-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const telemetrySpan = tracer.startSpan('gen_ai.stream', {
      traceId: trace_id,
      attributes: {
        'gen_ai.operation.name': 'stream',
        'freeai.route': '/v1/stream',
        'freeai.prompt.length': payload?.prompt?.length || 0,
      },
    });
    if (!payload || !payload.prompt) { res.writeHead(400); res.end('prompt required'); return; }
    const intent = await translateIntent(payload.prompt);
    const memoryHits = await queryMemory({ subject: intent.raw, limit: 3 }).catch(() => []);
    const context = await buildContext({ translatorOutput: intent, memoryHits, prevContext: null }).catch(() => null);
    const reasoning = await runReasoning({ translatorOutput: intent, contextSnapshot: context, memoryHits }).catch(() => null);
    const personaResult = await selectPersona({ intent, memoryHits, override: payload.persona, context, reasoning });
    const persona = personaResult.persona;
    const requestedSkills = await loadSkillsForRequest(payload.skills || []);
    const orchestratedSkills = await orchestrateSkills({ intent, persona, memoryHits, maxSkills: 5, context, reasoning });
    const skills = mergeSkills(requestedSkills, Array.isArray(orchestratedSkills) ? orchestratedSkills : (orchestratedSkills?.mounted_skills || []));
    const compiled = (await compilePromptRuntime({ prompt: payload.prompt, persona, skills, intent, contextSnapshot: context, reasoning, trace_id, payload })).compiled_prompt;
    const cacheKey = `${hashPrompt(payload.prompt)}|${persona.id}|${persona.version}|${skills.map(s=>s.id).join(',')}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      const receipt = makeReceipt({provider_id:'local-cache', model_id:'l1', http_status:200, fallback_used:false, kb_short_circuit:true, persona, intent, skills, trace_id, latency_ms: Date.now()-start});
      res.writeHead(200, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ body: cached, receipt }));
      telemetrySpan.end({ 'gen_ai.response.provider': 'local-cache', 'http.status_code': 200, 'freeai.cache.hit': true });
      return;
    }

    // Stream from providers via adapters
    const now = Date.now();
    const eligible = this.registry.providers.filter(p=> p.enabled !== false && (!p.cooldownUntil || p.cooldownUntil <= now));
    eligible.sort((a,b)=> (b.weight||0)-(a.weight||0));

    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
    res.write(`data: ${JSON.stringify({ event: 'stream_started', trace_id })}\n\n`);
    telemetrySpan.addEvent('stream.started', { eligible_providers: eligible.length });

    for (const p of eligible) {
      const adapter = this.registry.adapters.get(p.id);
      if (!adapter) continue;
      try {
        const model = p.pinnedModel;
        const streamInfo = await adapter.callStream(model, compiled, { persona, intent, skills, trace_id }, { timeout: payload.timeout || 15000 });
        if (streamInfo && streamInfo.stream) {
          const gen = streamInfo.stream;
          let firstTokenMs = null;
          for await (const chunkObj of gen) {
            if (!firstTokenMs) firstTokenMs = Date.now() - start;
            res.write(`data: ${JSON.stringify({ event: 'chunk', chunk: chunkObj.chunk, trace_id })}\n\n`);
          }
          // final
          const latency_ms = Date.now() - start;
          res.write(`data: ${JSON.stringify({ event: 'stream_end', trace_id, first_token_ms: firstTokenMs, total_latency_ms: latency_ms })}\n\n`);
          res.end();
          telemetrySpan.end({
            'gen_ai.response.provider': p.id,
            'gen_ai.response.model': model || 'unknown',
            'http.status_code': 200,
            'freeai.stream.first_token_ms': firstTokenMs || 0,
            'freeai.stream.total_latency_ms': latency_ms,
          });
          return;
        }
      } catch (e) {
        // record interruption and try next provider
        res.write(`data: ${JSON.stringify({ event: 'stream_interrupted', provider: p.id, reason: e.message, trace_id })}\n\n`);
        telemetrySpan.addEvent('stream.interrupted', { provider: p.id, reason: e.message });
        continue;
      }
    }

    // no providers produced stream -> fallback
    const kb = await import('../localkb.js');
    const fallback = kb.answerFallback(payload.prompt, { includeDiagnostics: true });
    res.write(`data: ${JSON.stringify({ event: 'fallback', body: fallback.answer, diagnostics: fallback.diagnostics, trace_id })}\n\n`);
    res.end();
    telemetrySpan.end({
      'gen_ai.response.provider': 'local_kb_fallback',
      'http.status_code': 200,
      'freeai.fallback_used': true,
      'freeai.retrieval.action': fallback.diagnostics?.retrieval?.action || 'incorrect',
    });
  }
}

function hashPrompt(p) {
  // simple stable hash for demo
  let h=0; for (let i=0;i<p.length;i++) h=(h*31 + p.charCodeAt(i))>>>0; return h.toString(36);
}
