import { appendTrainingObservation, loadTrainingConfig, loadTrainingState, writeTrainingEvidence } from './store.js';
import { runTrainingCycle } from './engine.js';

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function normalizeDomain(context, intent) {
  return String(context?.domain || (Array.isArray(intent?.domain_signals) && intent.domain_signals[0]) || intent?.intent_family || 'general').toLowerCase();
}

export async function observeInteraction({ payload, intent, context, reasoning, persona, skills, receipt, adaptiveReport = null, previewOnly = false }) {
  const config = await loadTrainingConfig();
  if (config.observe_requests === false) {
    return { recorded: false, reason: 'observation_disabled' };
  }
  const observation = {
    observation_id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
    trace_id: receipt?.trace_id || null,
    prompt_excerpt: String(payload?.prompt || '').slice(0, 240),
    intent_family: intent?.intent_family || null,
    task_type: intent?.task_type || null,
    domain: normalizeDomain(context, intent),
    topics: unique(intent?.topics || []),
    persona_id: persona?.id || null,
    skill_ids: (skills || []).map((skill) => skill.id),
    provider_id: receipt?.provider_id || null,
    preview_only: previewOnly,
    fallback_used: !!receipt?.fallback_used,
    validation_valid: receipt?.output_validation?.valid !== false,
    acquisition_used: !!adaptiveReport?.activated_now,
    generated_capability_used: !!adaptiveReport?.generated_persona || Array.isArray(adaptiveReport?.generated_skills) && adaptiveReport.generated_skills.length > 0,
    environment: config.environment || 'general',
    reasoning_mode: reasoning?.reasoning_mode || null,
  };
  await appendTrainingObservation(observation);
  await writeTrainingEvidence('observation', observation);
  if (config.enabled !== false && config.auto_run_on_request !== false && !previewOnly) {
    Promise.resolve().then(() => maybeRunTrainingCycle({ reason: 'request_observation' }).catch(() => null));
  }
  return { recorded: true, observation_id: observation.observation_id };
}

export async function maybeRunTrainingCycle({ reason = 'request', force = false } = {}) {
  const [config, state] = await Promise.all([loadTrainingConfig(), loadTrainingState()]);
  if (config.enabled === false && !force) return { status: 'skipped', reason: 'training_disabled' };
  if (state.running) return { status: 'skipped', reason: 'cycle_already_running' };
  return runTrainingCycle({ force, reason });
}