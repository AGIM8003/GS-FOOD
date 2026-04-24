import assert from 'assert';
import { validateNodeV1, graphUsesV4Features, NODE_TYPE_SUBGRAPH, NODE_TYPE_ROUTER } from '../src/swarm/nodeSchema.js';
import { validateSwarmGraphV1 } from '../src/swarm/graphSchema.js';

// subgraph_node validation
const sg1 = validateNodeV1({
  node_id: 'sg1', node_type: 'subgraph_node', config: {
    subgraph: {
      graph_id: 'inner', graph_name: 'Inner', entry_node_id: 'ip1',
      nodes: [{ node_id: 'ip1', node_type: 'prompt_node' }],
      edges: [],
    },
  },
}, { allowV4: true });
assert.ok(sg1.ok, 'valid subgraph_node should pass');

const sg2 = validateNodeV1({ node_id: 'sg2', node_type: 'subgraph_node', config: {} }, { allowV4: true });
assert.ok(!sg2.ok, 'subgraph_node without subgraph config should fail');

const sg3 = validateNodeV1({ node_id: 'sg3', node_type: 'subgraph_node', config: { subgraph: { graph_id: 'x' } } }, { allowV4: true });
assert.ok(!sg3.ok, 'incomplete subgraph config should fail');

// router_node validation
const rt1 = validateNodeV1({
  node_id: 'rt1', node_type: 'router_node', config: {
    routes: [
      { target_node_id: 'n1', condition: 'current.length > 5', label: 'long' },
      { target_node_id: 'n2', label: 'default' },
    ],
  },
}, { allowV4: true });
assert.ok(rt1.ok, 'valid router_node should pass');

const rt2 = validateNodeV1({ node_id: 'rt2', node_type: 'router_node', config: { routes: [] } }, { allowV4: true });
assert.ok(!rt2.ok, 'empty routes should fail');

const rt3 = validateNodeV1({ node_id: 'rt3', node_type: 'router_node', config: { routes: [{ condition: 'x' }] } }, { allowV4: true });
assert.ok(!rt3.ok, 'route without target_node_id should fail');

// V3-only should reject these types
const sg4 = validateNodeV1({ node_id: 'sg4', node_type: 'subgraph_node', config: {} }, { allowV3: true });
assert.ok(!sg4.ok, 'subgraph_node should be rejected in V3 mode');

const rt4 = validateNodeV1({ node_id: 'rt4', node_type: 'router_node', config: {} }, { allowV3: true });
assert.ok(!rt4.ok, 'router_node should be rejected in V3 mode');

// graphUsesV4Features
assert.ok(graphUsesV4Features([{ node_type: 'subgraph_node' }]));
assert.ok(graphUsesV4Features([{ node_type: 'router_node' }]));
assert.ok(!graphUsesV4Features([{ node_type: 'prompt_node' }]));
assert.ok(!graphUsesV4Features(null));

// Full graph with router_node should auto-detect v4
const routerGraph = {
  graph_id: 'g-router',
  graph_name: 'Router Test',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: { text: 'hello' },
  max_fan_out: 4,
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Start' } },
    { node_id: 'rt1', node_type: 'router_node', config: { routes: [{ target_node_id: 'p2' }, { target_node_id: 'p1' }] } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'After route' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
    { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'rt1' },
    { from_node_id: 'rt1', to_node_id: 'p2' },
    { from_node_id: 'rt1', to_node_id: 'm1' },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
};
const rg = validateSwarmGraphV1(routerGraph);
assert.ok(rg.ok, 'graph with router_node should validate: ' + JSON.stringify(rg.errors));
assert.strictEqual(rg.schema_version, 'v4');

console.log('PASS: v4_subgraph_router_nodes');
