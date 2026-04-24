import assert from 'assert';
import { validateSwarmGraphV1 } from '../src/swarm/graphSchema.js';

function base() {
  return {
    graph_id: 'g',
    graph_name: 'n',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    nodes: [
      {
        node_id: 'p1',
        node_type: 'prompt_node',
        role_id: 'r',
        task_lane: 'l',
        config: { prompt: 'hi' },
      },
      {
        node_id: 'm1',
        node_type: 'merge_node',
        role_id: 'mr',
        task_lane: 'l',
        config: { merge_strategy: 'first_valid' },
      },
      {
        node_id: 'f1',
        node_type: 'finalization_node',
        role_id: 'fin',
        task_lane: 'l',
        config: {},
      },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

{
  const r = validateSwarmGraphV1(base());
  assert.strictEqual(r.ok, true);
}

{
  const g = base();
  g.nodes.push({
    node_id: 'p1',
    node_type: 'prompt_node',
    role_id: 'r2',
    task_lane: 'l',
    config: { prompt: 'x' },
  });
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('duplicate')));
}

{
  const g = base();
  g.edges.push({ from_node_id: 'm1', to_node_id: 'p1' });
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('cycle')));
}

{
  const g = base();
  g.nodes[1].node_type = 'tool_node';
  g.nodes[1].config = {};
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(
    r.errors.some((e) => e.includes('tool_node.config.tool_id required') || e.includes('merge_node')),
    'tool_node without tool_id or missing merge_node should be rejected',
  );
}

{
  const g = base();
  g.nodes[1].node_type = 'escalation_node';
  g.nodes[1].config = {};
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('unsupported')));
}

{
  const g = base();
  g.nodes[1].node_type = 'prompt_node';
  g.nodes[1].config = { prompt: 'x' };
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('merge_node')));
}

{
  const g = base();
  g.entry_node_id = 'missing';
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
}

{
  const g = base();
  g.edges.push({ from_node_id: 'x', to_node_id: 'm1' });
  const r = validateSwarmGraphV1(g);
  assert.strictEqual(r.ok, false);
  assert.ok(r.errors.some((e) => e.includes('edge references')));
}

console.log('swarm_graph_schema test OK');
