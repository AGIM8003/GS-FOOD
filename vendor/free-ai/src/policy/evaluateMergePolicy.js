export function evaluateMergePolicy(ctx) {
  const { node, branches } = ctx || {};
  const zone = 'merge_decision';

  if (!node || !branches) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_merge_context',
      summary: 'Merge context incomplete',
      remediation: 'Provide node and branches for merge policy',
      evaluated_at: new Date().toISOString(),
    };
  }

  const allFailed = branches.every((b) => !b.ok);
  if (allFailed && branches.length > 0) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'all_branches_failed',
      summary: 'All merge branches failed; merge blocked by policy',
      remediation: 'At least one branch must succeed for merge',
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: 'merge_allowed',
    summary: 'Merge allowed by policy',
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}
