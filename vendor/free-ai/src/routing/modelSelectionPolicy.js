/**
 * Task-lane model selection policies. Modes are fail-closed: AUTO_PROMOTE_GOVERNED never
 * implies silent production default swap (handled in selectModelCandidate + promotion machine).
 */

export const POLICY_MODES = ['PINNED_ONLY', 'LATEST_ALIAS_ALLOWED', 'AUTO_PROMOTE_GOVERNED'];

/** @type {string[]} */
export const TASK_LANES = [
  'default_chat',
  'fast_chat',
  'deep_reasoning',
  'coding',
  'extraction',
  'structured_json',
  'vision',
  'embeddings',
  'image_generation',
  'long_context',
  'budget_free_tier',
];

const baseLane = (lane, extra) => ({
  lane,
  primary_rule: 'prefer_pinned_then_catalog_stable',
  fallback_rule: 'next_provider_same_lane_pin',
  allow_preview: false,
  allow_experimental: false,
  free_tier_weight: 0.5,
  min_capability_requirements: [],
  min_benchmark_gate: 'none',
  deprecation_handling: 'pin_until_replacement_validated',
  ...extra,
});

export function defaultPoliciesForMode(mode) {
  if (mode === 'PINNED_ONLY') {
    return Object.fromEntries(
      TASK_LANES.map((lane) => [
        lane,
        baseLane(lane, { allow_preview: false, allow_experimental: false, min_benchmark_gate: lane === 'default_chat' ? 'contract' : 'none' }),
      ]),
    );
  }
  if (mode === 'LATEST_ALIAS_ALLOWED') {
    return Object.fromEntries(
      TASK_LANES.map((lane) => [
        lane,
        baseLane(lane, {
          allow_preview: lane === 'fast_chat',
          allow_experimental: false,
          primary_rule: lane === 'fast_chat' ? 'allow_latest_alias_in_sandbox_lane' : 'prefer_pinned_then_catalog_stable',
        }),
      ]),
    );
  }
  if (mode === 'AUTO_PROMOTE_GOVERNED') {
    return Object.fromEntries(
      TASK_LANES.map((lane) => [
        lane,
        baseLane(lane, {
          min_benchmark_gate: 'contract',
          primary_rule: 'only_promoted_catalog_rows_for_default_lanes',
        }),
      ]),
    );
  }
  throw new Error(`unknown_policy_mode:${mode}`);
}
