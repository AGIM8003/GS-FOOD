import assert from 'assert';
import { executeToolNodeV1 } from '../src/swarm/executeToolNode.js';

{
  const r = await executeToolNodeV1({
    node: { node_id: 't1', node_type: 'tool_node', config: { tool_id: 'identity_transform', allow_network: true } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('tool_policy_denied'));
  assert.strictEqual(r.policy_result.reason_code, 'network_access_denied');
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't2', node_type: 'tool_node', config: { tool_id: 'identity_transform', allow_filesystem: true } },
    predecessorOutputs: {},
  });
  assert.strictEqual(r.ok, false);
  assert.ok(r.error.includes('tool_policy_denied'));
  assert.strictEqual(r.policy_result.reason_code, 'filesystem_access_denied');
}

{
  const r = await executeToolNodeV1({
    node: { node_id: 't3', node_type: 'tool_node', config: { tool_id: 'identity_transform', allow_network: false, allow_filesystem: false } },
    predecessorOutputs: { x: 1 },
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.policy_result.decision, 'allow');
}

console.log('tool_node_policy_enforcement test OK');
