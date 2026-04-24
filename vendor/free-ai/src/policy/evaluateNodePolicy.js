export function evaluateNodePolicy(ctx) {
  const { node, run } = ctx || {};
  const zone = 'node_execution';

  if (!node || !node.node_id) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_node',
      summary: 'No node provided for execution policy',
      remediation: 'Provide a valid node object',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (run && run.run_state === 'quarantined') {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'run_quarantined',
      summary: `Run ${run.run_id} is quarantined; node execution blocked`,
      remediation: 'Resolve quarantine before executing nodes',
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: 'node_allowed',
    summary: `Node ${node.node_id} execution allowed`,
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}
