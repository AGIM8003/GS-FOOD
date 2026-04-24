import { defaultPoliciesForMode } from './modelSelectionPolicy.js';
import { resolveTaskLane } from './resolveTaskLane.js';
import { getEffectivePinnedModelsByLane } from './pinnedModelMap.js';
import { getModelReliabilityScore } from '../telemetry/scorecard.js';
/**
 * Fail-closed selection: never returns a preview/experimental model unless lane policy allows.
 * AUTO_PROMOTE_GOVERNED uses only rows with promotion_status === 'promoted' when catalog supplies them;
 * otherwise falls back to lane pin (explicit).
 */
export function selectModelCandidate({ ctx, providers, catalogSnapshot, policyMode }) {
  const mode = policyMode || 'PINNED_ONLY';
  const policies = defaultPoliciesForMode(mode);
  const lane = resolveTaskLane(ctx || {});
  const policy = policies[lane] || policies.default_chat;
  const pins = getEffectivePinnedModelsByLane(providers);
  const pin = pins.lanes?.[lane] || pins.lanes?.default_chat;

  const models = catalogSnapshot?.models || [];
  const providerIds = new Set((providers || []).filter((p) => p.enabled !== false).map((p) => p.id));
  const scopedModels = models.filter((m) => providerIds.has(m.provider_id));

  // Use scorecard to exclude unreliable models (score < 0.8)
  const reliableScopedModels = scopedModels.filter(m => getModelReliabilityScore(m.model_id) >= 0.8);
  const promoted = reliableScopedModels.filter((m) => m.promotion_status === 'promoted' && m.status === 'stable');

  const byFreshest = (a, b) =>
    String(b.last_verified_at || b.discovered_at || '').localeCompare(String(a.last_verified_at || a.discovered_at || ''));

  const nonDeprecated = reliableScopedModels.filter((m) => m.deprecation_status !== 'deprecated' && m.status !== 'deprecated');
  const freeTierPreferred = nonDeprecated
    .filter((m) => m.free_tier_eligible === true && (m.status === 'stable' || m.status === 'latest'))
    .sort(byFreshest);

  const scoredBudgetCandidates = freeTierPreferred
    .map((m) => {
      let score = 0;
      if (m.status === 'stable') score += 3;
      if (m.status === 'latest') score += 2;
      if (m.benchmark_status === 'pass' || m.benchmark_status === 'benchmark_passed') score += 2;
      if (m.promotion_status === 'promoted') score += 2;
      if (m.provider_id === pin.provider_id) score += 1;
      const freshness = String(m.last_verified_at || m.discovered_at || '');
      return { model: m, score, freshness };
    })
    .sort((a, b) => b.score - a.score || String(b.freshness).localeCompare(String(a.freshness)));

  if (mode === 'AUTO_PROMOTE_GOVERNED' && promoted.length) {
    const match = promoted.find((m) => m.provider_id === pin.provider_id) || promoted.sort(byFreshest)[0];
    return { lane, policy_mode: mode, provider_id: match.provider_id, model_id: match.model_id, source: 'promoted_catalog' };
  }

  if (mode !== 'PINNED_ONLY' && lane === 'budget_free_tier' && scoredBudgetCandidates.length) {
    const preferred = scoredBudgetCandidates[0].model;
    return {
      lane,
      policy_mode: mode,
      provider_id: preferred.provider_id,
      model_id: preferred.model_id,
      source: 'free_tier_catalog_scored',
    };
  }

  if (mode === 'LATEST_ALIAS_ALLOWED' && policy.allow_preview) {
    const latestish = reliableScopedModels
      .filter((m) => m.release_channel === 'latest' || String(m.model_id).includes('latest'))
      .sort(byFreshest)[0];
    if (latestish) {
      return { lane, policy_mode: mode, provider_id: latestish.provider_id, model_id: latestish.model_id, source: 'latest_alias_lane' };
    }
  }

  return {
    lane,
    policy_mode: mode,
    provider_id: pin.provider_id,
    model_id: pin.model_id,
    source: 'explicit_pin',
  };
}

/**
 * Merge control-plane choice into per-provider model try order for `ProviderRegistry`.
 * `PINNED_ONLY` leaves `pinnedModel` + `candidates` unchanged (fail-closed default).
 */
export function orderModelsForProvider(providerRow, choice, policyMode) {
  const mode = policyMode || 'PINNED_ONLY';
  const base = [providerRow.pinnedModel].concat(providerRow.candidates || []).filter(Boolean);
  if (mode === 'PINNED_ONLY' || !choice?.model_id || choice.provider_id !== providerRow.id) {
    return base;
  }
  const rest = base.filter((m) => m !== choice.model_id);
  return [choice.model_id, ...rest];
}
