import { readPinnedModelsByLane } from '../models/catalogStore.js';

/**
 * Effective pins: file override wins; else derive from providers.json pinnedModel per provider for default lane.
 * @param {object[]} providers
 * @param {string} [rootOverride]
 */
export function getEffectivePinnedModelsByLane(providers, rootOverride) {
  const fromFile = readPinnedModelsByLane(rootOverride);
  if (fromFile && typeof fromFile === 'object') return fromFile;
  const primary = (providers || []).find((p) => p.enabled)?.pinnedModel || (providers || [])[0]?.pinnedModel;
  const pid = (providers || []).find((p) => p.enabled)?.id || (providers || [])[0]?.id;
  return {
    schema_version: 'freeaiPinnedModelsByLane.v1',
    policy_mode: 'PINNED_ONLY',
    lanes: {
      default_chat: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      fast_chat: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      deep_reasoning: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      coding: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      extraction: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      structured_json: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      vision: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      embeddings: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      image_generation: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      long_context: { provider_id: pid || 'unknown', model_id: primary || 'UNKNOWN' },
      budget_free_tier: { provider_id: (providers || []).find((p) => p.free_tier_eligible)?.id || pid, model_id: primary || 'UNKNOWN' },
    },
  };
}
