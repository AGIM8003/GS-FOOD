import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { getRun, __resetSwarmStoreForTests } from '../src/swarm/graphStateStore.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();

const graph = {
  graph_id: 'g-cond-runtime',
  graph_name: 'Conditional Runtime',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: {},
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'start' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'left' } },
    { node_id: 'p3', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'right' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
    { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2', edge_type: 'conditional', condition: "outputs['p1'] === 'take-left'" },
    { from_node_id: 'p1', to_node_id: 'p3', edge_type: 'conditional', condition: "outputs['p1'] !== 'take-left'" },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'p3', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
};

const execLog = [];
const executePromptNode = async ({ node }) => {
  execLog.push(node.node_id);
  if (node.node_id === 'p1') return { output: 'take-left', meta: {} };
  return { output: `out-${node.node_id}`, meta: {} };
};

const result = await runSwarmGraph(graph, { executePromptNode, tenant_id: 't1' });
assert.strictEqual(result.ok, true);
assert.deepStrictEqual(execLog.includes('p2'), true);
assert.deepStrictEqual(execLog.includes('p3'), false);

const run = getRun(result.run_id);
assert.ok(run);
assert.strictEqual(run.node_states.p3, 'skipped');
assert.strictEqual(run.node_states.p2, 'completed');
assert.strictEqual(run.run_state, 'completed');

__resetSwarmStoreForTests();
console.log('swarm_conditional_runtime test OK');
