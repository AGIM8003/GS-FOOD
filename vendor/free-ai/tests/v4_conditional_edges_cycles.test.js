import assert from 'assert';
import { validateEdgeV1, edgeIsConditional, graphUsesConditionalEdges } from '../src/swarm/edgeSchema.js';
import { validateSwarmGraphV1, DEFAULT_MAX_FAN_OUT, MAX_FAN_OUT_CEILING } from '../src/swarm/graphSchema.js';

function baseGraph(overrides = {}) {
  return {
    graph_id: 'g-cond',
    graph_name: 'Conditional Test',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: { text: 'hello' },
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go' } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go2' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
    ...overrides,
  };
}

// Edge validation
const e1 = validateEdgeV1({ from_node_id: 'a', to_node_id: 'b', edge_type: 'conditional', condition: 'current.length > 0' }, { allowV4: true });
assert.ok(e1.ok, 'conditional edge with condition should pass');

const e2 = validateEdgeV1({ from_node_id: 'a', to_node_id: 'b', edge_type: 'conditional' }, { allowV4: true });
assert.ok(!e2.ok, 'conditional edge without condition should fail');

const e3 = validateEdgeV1({ from_node_id: 'a', to_node_id: 'b', edge_type: 'unknown_type' }, { allowV4: true });
assert.ok(!e3.ok, 'unknown edge_type should fail');

const e4 = validateEdgeV1({ from_node_id: 'a', to_node_id: 'b', edge_type: 'conditional', condition: 'x > 0' });
assert.ok(e4.ok, 'conditional edge without allowV4 should still pass (no edge_type check in v1 mode)');

// Edge detection helpers
assert.ok(edgeIsConditional({ edge_type: 'conditional', condition: 'x > 0' }));
assert.ok(!edgeIsConditional({ edge_type: 'default' }));
assert.ok(!edgeIsConditional(null));

assert.ok(graphUsesConditionalEdges([{ edge_type: 'conditional', condition: 'y' }]));
assert.ok(!graphUsesConditionalEdges([{ from_node_id: 'a', to_node_id: 'b' }]));

// Graph schema: V4 auto-detect via conditional edges
const condGraph = baseGraph({
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2', edge_type: 'conditional', condition: 'current.length > 0' },
    { from_node_id: 'p1', to_node_id: 'm1' },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
});
const cRes = validateSwarmGraphV1(condGraph);
assert.ok(cRes.ok, 'conditional edge graph should validate');
assert.strictEqual(cRes.schema_version, 'v4', 'should auto-detect v4');

// Graph schema: explicit v4 with allow_cycles=true (no actual cycle)
const v4Explicit = baseGraph({ graph_schema_version: 'v4', allow_cycles: true });
const v4Res = validateSwarmGraphV1(v4Explicit);
assert.ok(v4Res.ok, 'explicit v4 with allow_cycles should validate');
assert.strictEqual(v4Res.schema_version, 'v4');
assert.strictEqual(v4Res.allow_cycles, true);

// Constants
assert.strictEqual(DEFAULT_MAX_FAN_OUT, 2);
assert.strictEqual(MAX_FAN_OUT_CEILING, 16);

console.log('PASS: v4_conditional_edges_cycles');
