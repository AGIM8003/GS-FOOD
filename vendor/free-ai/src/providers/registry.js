import fs from 'fs/promises';
import { join } from 'path';

import { tracer as telemetryTracer } from '../telemetry/tracer.js';
import tracing from '../tracing/index.js';
import { OpenRouterAdapter } from './openrouterAdapter.js';
import { OpenAIAdapter } from './openaiAdapter.js';
import { AnthropicAdapter } from './anthropicAdapter.js';
import { GeminiAdapter } from './geminiAdapter.js';
import { OllamaAdapter } from './ollamaAdapter.js';
import { GroqAdapter } from './groqAdapter.js';
import { HuggingFaceAdapter } from './huggingfaceAdapter.js';
import { FireworksAdapter } from './fireworksAdapter.js';
import { recordUsage, snapshotFor } from './budgetGuardian.js';
import { recordProviderCapability, getProviderCapability } from './healthMatrix.js';
import { getCooldown, setCooldown, clearCooldown } from './cooldownManager.js';

export class ProviderRegistry {
  constructor(cfg) {
    this.cfg = cfg;
    this.providers = (cfg.providers || []).map(p=> ({...p, state:{healthy:false, score:0}}));
    this.adapters = new Map();
    // register known adapters
    for (const p of this.providers) {
      if (p.id === 'openrouter') this.adapters.set(p.id, new OpenRouterAdapter(p));
      if (p.id === 'openai') this.adapters.set(p.id, new OpenAIAdapter(p));
      if (p.id === 'anthropic') this.adapters.set(p.id, new AnthropicAdapter(p));
      if (p.id === 'gemini') this.adapters.set(p.id, new GeminiAdapter(p));
      if (p.id === 'ollama') this.adapters.set(p.id, new OllamaAdapter(p));
      if (p.id === 'groq') this.adapters.set(p.id, new GroqAdapter(p));
      if (p.id === 'huggingface') this.adapters.set(p.id, new HuggingFaceAdapter(p));
      if (p.id === 'fireworks') this.adapters.set(p.id, new FireworksAdapter(p));
    }
  }

  async callProviders(compiledPrompt, ctx, opts={}) {
    // lightweight tracing around provider ladder attempts
    try{ ctx._trace_span = tracing.startSpan('providers.callProviders', { prompt_snippet: (compiledPrompt||'').slice(0,200) }); }catch(e){}
    // determine eligible providers: enabled + not in cooldown
    const capability = ctx?.response_contract_id && ctx.response_contract_id !== 'plain_text' ? 'structured_output' : 'plain_chat';
    const now = Date.now();
    let eligible = this.providers.filter(p=> {
      const cooldown = getCooldown(p.id);
      return p.enabled !== false && (!(cooldown && cooldown.until > now)) && (!p.cooldownUntil || p.cooldownUntil <= now);
    });
    eligible = eligible.map(p=> {
      const quota = snapshotFor(p.id);
      const health = getProviderCapability(p.id, capability);
      const reliability = quota.free_reliability_score || 0;
      const effectiveScore = (p.weight||0) + (p.state?.score||0) + (health.healthy ? 2 : -4) + (reliability * 5);
      return {...p, effectiveScore, quota, health};
    });
    eligible.sort((a,b)=> b.effectiveScore - a.effectiveScore);

    const failureChain = [];

    for (const p of eligible) {
      try{ tracing.addEvent(ctx._trace_span, 'provider.consider', { provider: p.id }); }catch(e){}
      const adapter = this.adapters.get(p.id);
      if (!adapter) continue;
      // per-provider candidate chain: pinnedModel then candidates
      const modelCandidates = [p.pinnedModel].concat(p.candidates||[]).filter(Boolean);
      for (const model of modelCandidates) {
        let attempts = 0; const maxAttempts = opts.maxAttemptsPerProvider || 2;
        while (attempts < maxAttempts) {
          attempts++;
          const start = Date.now();
          try {
            const providerCtx = { ...ctx };
            if (ctx?.response_format) providerCtx.response_format = ctx.response_format;
            const out = await adapter.call(model, compiledPrompt, providerCtx, { timeout: opts.timeout || 15000 });
            const latency = Date.now() - start;
              try{ tracing.addEvent(ctx._trace_span, 'provider.attempt', { provider: p.id, model, latency, ok: !!out?.ok }); }catch(e){}
            if (out && out.ok) {
              // normalized receipt
              const receipt = {
                provider_id: p.id,
                model_id: model,
                http_status: out.http_status || 200,
                finish_reason: out.finish_reason || null,
                usage: out.usage || null,
                latency_ms: latency,
                free_tier_class: p.free_tier_class || null,
                route_reason: ctx?.ladderDecision?.chosen_provider === p.id ? 'ladder_choice' : 'fallback_choice',
                failure_class: null,
                cooldown_applied: false,
                local_survival_used: false,
                quota_snapshot: p.quota,
                free_reliability_score: p.quota?.free_reliability_score || 0,
              };
              p.state.healthy = true; p.lastChecked = new Date().toISOString(); p.state.score = (p.state.score||0) + 1;
              recordProviderCapability(p.id, capability, { ok: true, latency_ms: latency });
              recordUsage(p.id, { requests: 1, tokens: out?.usage?.total_tokens || 0, status: receipt.http_status, latency });
              clearCooldown(p.id);
              return { ok:true, output: out.text, receipt };
              } else {
              // handle normalized adapter error object
              const errClass = normalizeFailureClass(out?.error_class, out?.http_status);
                try{ tracing.addEvent(ctx._trace_span, 'provider.error', { provider: p.id, model, errClass }); }catch(e){}
              failureChain.push({ provider: p.id, model, error: errClass, raw: out?.raw_error || null });
              recordProviderCapability(p.id, capability, { ok: false, latency_ms: latency, failure_class: errClass });
              recordUsage(p.id, { requests: 1, tokens: 0, status: out?.http_status || 500, latency, failure_class: errClass });
              const policy = applyFailurePolicy(p.id, errClass);
              p.cooldownUntil = policy.cooldownUntil;
              if (errClass === 'model_not_found') break;
              if (policy.breakProvider) break;
            }
          } catch (e) {
            p.cooldownUntil = Date.now() + (60*1000);
            try{ tracing.addEvent(ctx._trace_span, 'provider.exception', { provider: p.id, model, message: e.message }); }catch(e){}
            recordProviderCapability(p.id, capability, { ok: false, latency_ms: Date.now() - start, failure_class: 'unknown_error' });
            recordUsage(p.id, { requests: 1, tokens: 0, status: 500, latency: Date.now() - start, failure_class: 'unknown_error' });
            failureChain.push({ provider: p.id, model, error: 'unknown_error', raw: e.message });
            break;
          }
        }
      }
    }
    try{ if (ctx._trace_span) tracing.endSpan(ctx._trace_span, { status: 'fail', failureCount: failureChain.length }); }catch(e){}
    return { ok:false, failureChain };
  }
}

export async function callProviderWithFallback() {
  // placeholder if needed elsewhere
}

function normalizeFailureClass(errorClass, status) {
  if (errorClass === 'quota_error') return 'quota_exhausted';
  if (errorClass) return errorClass;
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 404) return 'model_not_found';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'upstream_error';
  return 'unknown_error';
}

function applyFailurePolicy(providerId, errClass) {
  if (errClass === 'auth_error') {
    const cooldown = setCooldown(providerId, 30 * 60 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: true };
  }
  if (errClass === 'quota_exhausted') {
    const cooldown = setCooldown(providerId, 10 * 60 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: true };
  }
  if (errClass === 'rate_limited') {
    const cooldown = setCooldown(providerId, 2 * 60 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: true };
  }
  if (errClass === 'timeout') {
    const cooldown = setCooldown(providerId, 30 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: false };
  }
  if (errClass === 'upstream_error') {
    const cooldown = setCooldown(providerId, 60 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: true };
  }
  if (errClass === 'policy_blocked') {
    const cooldown = setCooldown(providerId, 15 * 60 * 1000, errClass);
    return { cooldownUntil: cooldown.until, breakProvider: true };
  }
  return { cooldownUntil: Date.now(), breakProvider: true };
}
