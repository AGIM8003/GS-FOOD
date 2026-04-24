import assert from 'assert';
import { POLICY_ZONES, evaluatePolicy } from '../src/policy/policyFabric.js';

const REQUIRED_ZONES = [
  'graph_admission',
  'node_execution',
  'merge_decision',
  'resume_execution',
  'human_review_decision',
  'tool_execution',
  'provider_model_eligibility',
];

for (const zone of REQUIRED_ZONES) {
  assert.ok(POLICY_ZONES.includes(zone), `Missing required zone: ${zone}`);
}

for (const zone of REQUIRED_ZONES) {
  const result = evaluatePolicy(zone, {
    graph: { graph_id: 'g', nodes: [], edges: [] },
    node: { node_id: 'n' },
    run: { run_id: 'r', run_state: 'running', resume_eligible: true, execution_checkpoint: 'n', graph_hash: 'h', graph_snapshot: {} },
    branches: [{ ok: true }],
    tool_id: 'identity_transform',
    tool_class: 'local_transform',
    allow_network: false,
    allow_filesystem: false,
  });
  assert.ok(result.policy_id, `${zone} must return policy_id`);
  assert.ok(result.policy_zone === zone, `${zone} must return correct zone`);
  assert.ok(['allow', 'deny'].includes(result.decision), `${zone} must return allow or deny`);
  assert.ok(typeof result.blocking === 'boolean', `${zone} must return boolean blocking`);
  assert.ok(result.reason_code, `${zone} must return reason_code`);
  assert.ok(result.evaluated_at, `${zone} must return evaluated_at`);
}

console.log('policy_zone_coverage_swarm test OK');
