export function evaluateGraphPolicy(ctx) {
  const { graph } = ctx || {};
  const zone = 'graph_admission';

  if (!graph || typeof graph !== 'object') {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_graph',
      summary: 'No graph body provided for admission',
      remediation: 'Provide a valid graph body',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!graph.graph_id || !graph.nodes || !graph.edges) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'incomplete_graph',
      summary: 'Graph is missing required fields (graph_id, nodes, edges)',
      remediation: 'Ensure graph_id, nodes[], and edges[] are present',
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: 'graph_valid',
    summary: 'Graph admitted by policy',
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}
