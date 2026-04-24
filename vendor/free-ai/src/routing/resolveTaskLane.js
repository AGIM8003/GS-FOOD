/**
 * Map coarse request hints to a task lane (deterministic, host-overridable later via settings).
 * @param {object} ctx
 */
export function resolveTaskLane(ctx = {}) {
  const contract = ctx.response_contract_id || ctx.output_contract || '';
  if (contract && String(contract).includes('json')) return 'structured_json';
  if (ctx.vision === true || ctx.modality === 'vision') return 'vision';
  if (ctx.embeddings === true) return 'embeddings';
  if (ctx.intent_family === 'command' || ctx.task_type === 'code') return 'coding';
  if (ctx.intent_family === 'research' || ctx.reasoning_mode === 'deep') return 'deep_reasoning';
  if (ctx.intent_family === 'extraction') return 'extraction';
  if (ctx.budget === 'free' || ctx.free_tier_preferred) return 'budget_free_tier';
  if (ctx.speed === 'fast') return 'fast_chat';
  if (ctx.long_context === true) return 'long_context';
  return 'default_chat';
}
