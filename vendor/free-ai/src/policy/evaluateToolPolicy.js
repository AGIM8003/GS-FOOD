const ALLOWED_TOOL_CLASSES = [
  'local_transform',
  'json_extract',
  'deterministic_template_render',
  'internal_readonly_lookup',
];

export function evaluateToolPolicy(ctx) {
  const { tool_id, tool_class, allow_network, allow_filesystem } = ctx || {};
  const zone = 'tool_execution';

  if (!tool_id) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_tool_id',
      summary: 'No tool_id provided',
      remediation: 'Provide a registered tool_id',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!ALLOWED_TOOL_CLASSES.includes(tool_class)) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'disallowed_tool_class',
      summary: `Tool class '${tool_class}' is not in the allowed list`,
      remediation: `Allowed classes: ${ALLOWED_TOOL_CLASSES.join(', ')}`,
      evaluated_at: new Date().toISOString(),
    };
  }

  if (allow_network === true) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'network_access_denied',
      summary: 'Tool requests network access which is denied by policy',
      remediation: 'Set allow_network to false',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (allow_filesystem === true) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'filesystem_access_denied',
      summary: 'Tool requests filesystem mutation which is denied by policy',
      remediation: 'Set allow_filesystem to false',
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: 'tool_allowed',
    summary: `Tool ${tool_id} execution allowed`,
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}

export { ALLOWED_TOOL_CLASSES };
