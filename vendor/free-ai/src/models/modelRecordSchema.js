/**
 * Normalized API-facing model record for the control plane (not modelManifest.v1 install payloads).
 */

export const MODEL_STATUS = ['stable', 'latest', 'preview', 'deprecated', 'experimental', 'quarantined', 'unknown'];

export const PROMOTION_STAGES = [
  'discovered',
  'normalized',
  'candidate',
  'staged',
  'benchmark_passed',
  'canary',
  'promoted',
  'rollback_candidate',
  'rolled_back',
  'quarantined',
];

/** @param {string} v */
export function normalizeUnknown(v, fallback = 'UNKNOWN') {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}

/**
 * @param {object} partial
 * @returns {object}
 */
export function normalizeModelRecord(partial) {
  const now = new Date().toISOString();
  return {
    provider_id: normalizeUnknown(partial.provider_id, 'UNKNOWN'),
    model_id: normalizeUnknown(partial.model_id, 'UNKNOWN'),
    alias_ids: Array.isArray(partial.alias_ids) ? partial.alias_ids.map(String) : [],
    canonical_name: normalizeUnknown(partial.canonical_name, 'UNKNOWN'),
    release_channel: normalizeUnknown(partial.release_channel, 'unknown'),
    version_label: normalizeUnknown(partial.version_label, 'UNKNOWN'),
    discovered_at: partial.discovered_at || now,
    last_verified_at: partial.last_verified_at || null,
    status: MODEL_STATUS.includes(partial.status) ? partial.status : 'unknown',
    capability_flags: partial.capability_flags && typeof partial.capability_flags === 'object' ? partial.capability_flags : {},
    modality_flags: partial.modality_flags && typeof partial.modality_flags === 'object' ? partial.modality_flags : { text: true },
    structured_output_supported: partial.structured_output_supported === true ? true : partial.structured_output_supported === false ? false : null,
    tool_calling_supported: partial.tool_calling_supported === true ? true : partial.tool_calling_supported === false ? false : null,
    context_window_known: Number.isFinite(partial.context_window_known) ? partial.context_window_known : null,
    free_tier_eligible: partial.free_tier_eligible === true ? true : partial.free_tier_eligible === false ? false : null,
    quota_tier: normalizeUnknown(partial.quota_tier, 'UNKNOWN'),
    benchmark_status: normalizeUnknown(partial.benchmark_status, 'not_run'),
    promotion_status: PROMOTION_STAGES.includes(partial.promotion_status) ? partial.promotion_status : 'discovered',
    deprecation_status: normalizeUnknown(partial.deprecation_status, 'none'),
    replacement_of: partial.replacement_of || null,
    replaced_by: partial.replaced_by || null,
    evidence_refs: Array.isArray(partial.evidence_refs) ? partial.evidence_refs.map(String) : [],
  };
}
