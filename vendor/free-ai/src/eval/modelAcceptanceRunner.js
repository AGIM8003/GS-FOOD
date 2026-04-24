/**
 * Lightweight acceptance gates for catalog candidates (no live vendor calls here).
 */

const GATE_FAMILIES = [
  'contract',
  'latency',
  'output_shape',
  'tool_calling',
  'structured_output',
  'fallback_survivability',
  'auth_config',
  'comparative_quality',
  'quota_safety',
];

/**
 * @param {object} input
 * @param {object} input.model normalized model record
 * @param {string} input.lane
 * @param {string} [input.test_pack_id]
 */
export function runModelAcceptanceGates(input) {
  const m = input.model || {};
  const lane = input.lane || 'default_chat';
  const runAt = new Date().toISOString();
  const notes = [];
  let pass = true;

  if (!m.model_id || m.model_id === 'UNKNOWN') {
    pass = false;
    notes.push('contract:missing_model_id');
  }
  if (m.promotion_status && !['discovered', 'normalized', 'candidate'].includes(m.promotion_status) && m.benchmark_status === 'not_run') {
    pass = false;
    notes.push('contract:advanced_without_benchmark');
  }
  if (lane === 'structured_json' && m.structured_output_supported === false) {
    pass = false;
    notes.push('structured_output:unsupported');
  }

  return {
    schema_version: 'freeaiModelAcceptanceResult.v1',
    provider_id: m.provider_id,
    model_id: m.model_id,
    lane,
    test_pack_id: input.test_pack_id || 'synthetic_default',
    pass_fail: pass ? 'pass' : 'fail',
    score: pass ? 1 : 0,
    observed_latency_ms: null,
    observed_error_rate: null,
    schema_ok: pass,
    notes: notes.join(';') || 'ok',
    run_at: runAt,
    gate_families_evaluated: GATE_FAMILIES,
  };
}
