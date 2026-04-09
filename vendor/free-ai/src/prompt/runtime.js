import fs from 'fs';
import path from 'path';
import { compilePrompt } from './compiler.js';
import { selectOutputContract } from './contracts.js';
import { getActiveVariant } from './promotion.js';
import { buildLearningPromptContext } from '../training/runtime.js';

const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'prompts');

function ensureDir() {
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

export async function compilePromptRuntime({ prompt, persona, skills, intent, contextSnapshot, reasoning, trace_id, payload = {} }) {
  const outputContract = selectOutputContract({ intent, payload });
  const prompt_family_id = payload.prompt_family_id || inferPromptFamily(intent, outputContract);
  const defaultVariant = selectVariant({ intent, outputContract, reasoning });
  const prompt_variant = payload.prompt_variant || getActiveVariant(prompt_family_id, defaultVariant) || defaultVariant;
  const learningContext = await buildLearningPromptContext({ context: contextSnapshot, intent, persona, skills });
  const compiled = compilePrompt(prompt, persona, skills, intent, { contextSnapshot, learningContext });
  const runtimePrompt = decorateCompiledPrompt(compiled, { outputContract, prompt_family_id, prompt_variant, reasoning, trace_id });

  const metadata = {
    prompt_contract_version: 'promptContract.v1',
    prompt_template_version: 'promptTemplate.v2',
    prompt_strategy_id: 'freeai.default.runtime',
    prompt_family_id,
    prompt_variant,
    persona_id: persona?.id || null,
    persona_version: persona?.version || null,
    skill_ids: (skills || []).map((s) => s.id),
    skill_versions: (skills || []).map((s) => s.version || 'v1'),
    translator_summary: {
      intent_family: intent?.intent_family || null,
      task_type: intent?.task_type || null,
      constraints: intent?.constraints || null,
    },
    context_summary: contextSnapshot ? {
      domain: contextSnapshot.domain,
      continuity_score: contextSnapshot.continuity_score,
      skill_hints: contextSnapshot.skill_hints || [],
      persona_hints: contextSnapshot.persona_hints || [],
    } : null,
    reasoning_summary: reasoning ? {
      mode: reasoning.reasoning_mode,
      strategy_type: reasoning.strategy_type,
      confidence: reasoning.confidence,
    } : null,
    learning_summary: learningContext ? {
      domain: learningContext.domain,
      environment: learningContext.environment,
      regulatory_mode: learningContext.regulatory_mode,
      guidance: learningContext.guidance || [],
      compliance_notes: learningContext.compliance_notes || [],
    } : null,
    response_contract_id: outputContract.id,
    response_contract_type: outputContract.type,
    route_hint: intent?.model_preference_hint || null,
    trace_id,
    compiled_at: new Date().toISOString(),
  };
  persistPromptReceipt({ compiled_prompt: runtimePrompt, metadata });
  return { compiled_prompt: runtimePrompt, metadata, output_contract: outputContract };
}

function decorateCompiledPrompt(compiled, { outputContract, prompt_family_id, prompt_variant, reasoning, trace_id }) {
  const lines = [];
  lines.push(`-- Prompt Runtime --`);
  lines.push(`Prompt Family: ${prompt_family_id}`);
  lines.push(`Prompt Variant: ${prompt_variant}`);
  lines.push(`Trace ID: ${trace_id || 'unknown'}`);
  if (reasoning?.strategy_type) lines.push(`Reasoning Strategy: ${reasoning.strategy_type}`);
  lines.push(`Output Contract: ${outputContract.id}`);
  if (outputContract.type === 'json') {
    lines.push(`Return only valid JSON matching the requested contract.`);
  }
  lines.push(compiled.trim());
  return lines.join('\n') + '\n';
}

function inferPromptFamily(intent, outputContract) {
  if (outputContract.id === 'plan_output') return 'planning';
  if (intent?.intent_family) return intent.intent_family;
  return 'general';
}

function selectVariant({ intent, outputContract, reasoning }) {
  if (outputContract.type === 'json') return 'variant_b_structured';
  if (reasoning?.confidence !== undefined && reasoning.confidence < 0.55) return 'variant_c_cautious';
  if (intent?.urgency && intent.urgency > 0.7) return 'variant_a_fast';
  return 'variant_a_default';
}

function persistPromptReceipt(record) {
  try {
    ensureDir();
    const file = path.join(EVIDENCE_DIR, `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
    fs.writeFileSync(file, JSON.stringify(record, null, 2));
  } catch {}
}
