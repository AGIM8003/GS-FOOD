import { normalizeModelRecord } from '../modelRecordSchema.js';

/**
 * @param {string} providerId
 * @param {object[]} rawModels
 */
export function normalizeProviderCatalog(providerId, rawModels) {
  return (rawModels || []).map((m) =>
    normalizeModelRecord({
      provider_id: providerId,
      model_id: m.model_id,
      canonical_name: m.canonical_name || m.model_id,
      release_channel: m.release_channel || 'unknown',
      version_label: m.version_label || 'UNKNOWN',
      status: m.status || 'unknown',
      modality_flags: m.modality_flags || { text: true },
      free_tier_eligible: m.free_tier_eligible,
      benchmark_status: m.benchmark_status || 'not_run',
      deprecation_status: m.deprecation_status || (m.status === 'deprecated' ? 'deprecated' : 'none'),
      last_verified_at: m.last_verified_at || new Date().toISOString(),
      promotion_status: 'discovered',
    }),
  );
}
