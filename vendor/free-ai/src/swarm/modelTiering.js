/**
 * Model Tiering — per-node model tier assignment.
 *
 * Allows assigning cheap models for triage/simple nodes and expensive
 * models for reasoning-heavy nodes. Configured per node via config.model_tier
 * or via graph-level default_model_tier.
 */

const MODEL_TIERS = {
  economy: { label: 'Economy', cost_multiplier: 0.1, models: ['gemini-flash', 'gpt-4o-mini', 'llama-3-8b'] },
  standard: { label: 'Standard', cost_multiplier: 1.0, models: ['gpt-4o', 'gemini-pro', 'claude-3-sonnet'] },
  premium: { label: 'Premium', cost_multiplier: 3.0, models: ['gpt-4-turbo', 'claude-3-opus', 'gemini-ultra'] },
  reasoning: { label: 'Reasoning', cost_multiplier: 5.0, models: ['o1', 'o3', 'deepseek-r1'] },
};

function resolveModelTier(nodeConfig, graphConfig) {
  const tier = nodeConfig?.model_tier || graphConfig?.default_model_tier || 'standard';
  if (!MODEL_TIERS[tier]) return { tier: 'standard', config: MODEL_TIERS.standard };
  return { tier, config: MODEL_TIERS[tier] };
}

function getModelHintsForTier(tier) {
  const t = MODEL_TIERS[tier];
  if (!t) return [];
  return t.models.slice();
}

function estimateCostMultiplier(nodeConfig, graphConfig) {
  const { config } = resolveModelTier(nodeConfig, graphConfig);
  return config.cost_multiplier;
}

function listTiers() {
  return Object.entries(MODEL_TIERS).map(([id, t]) => ({
    tier_id: id,
    label: t.label,
    cost_multiplier: t.cost_multiplier,
    model_count: t.models.length,
  }));
}

export { MODEL_TIERS, resolveModelTier, getModelHintsForTier, estimateCostMultiplier, listTiers };
