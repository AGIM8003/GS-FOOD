import assert from 'assert';
import { validateSwarmGraphV1 } from '../src/swarm/graphSchema.js';

function threeWayGraph(overrides = {}) {
  return {
    graph_id: 'g-fan',
    graph_name: 'Fan-out Test',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: { text: 'hello' },
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go' } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go2' } },
      { node_id: 'p3', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go3' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p1', to_node_id: 'p3' },
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'p3', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
    ...overrides,
  };
}

// Default fan-out=2 should reject 3-way fan-out
const r1 = validateSwarmGraphV1(threeWayGraph());
assert.ok(!r1.ok, 'fan-out 3 should fail with default limit of 2');
assert.ok(r1.errors.some((e) => e.includes('fan-out')));

// max_fan_out=3 in body should allow 3-way fan-out
const r2 = validateSwarmGraphV1(threeWayGraph({ max_fan_out: 3 }));
assert.ok(r2.ok, 'fan-out 3 with max_fan_out=3 should pass');
assert.strictEqual(r2.resolved_max_fan_out, 3);

// max_fan_out=4 should also allow
const r3 = validateSwarmGraphV1(threeWayGraph({ max_fan_out: 4 }));
assert.ok(r3.ok, 'fan-out 3 with max_fan_out=4 should pass');

// max_fan_out cannot exceed ceiling
const r4 = validateSwarmGraphV1(threeWayGraph({ max_fan_out: 100 }));
assert.ok(r4.ok);
assert.strictEqual(r4.resolved_max_fan_out, 16, 'should cap at ceiling of 16');

// Env-based fan-out (set and restore)
const oldEnv = process.env.FREEAI_MAX_FAN_OUT;
process.env.FREEAI_MAX_FAN_OUT = '5';
const r5 = validateSwarmGraphV1(threeWayGraph());
assert.ok(r5.ok, 'env FREEAI_MAX_FAN_OUT=5 should allow 3-way fan-out');
assert.strictEqual(r5.resolved_max_fan_out, 5);

// Body max_fan_out overrides env
const r6 = validateSwarmGraphV1(threeWayGraph({ max_fan_out: 3 }));
assert.ok(r6.ok);
assert.strictEqual(r6.resolved_max_fan_out, 3, 'body max_fan_out should take precedence');

if (oldEnv === undefined) delete process.env.FREEAI_MAX_FAN_OUT;
else process.env.FREEAI_MAX_FAN_OUT = oldEnv;

console.log('PASS: v4_configurable_fanout');
