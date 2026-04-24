import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { __resetSwarmStoreForTests } from '../src/swarm/graphStateStore.js';

process.env.FREEAI_SWARM_PERSIST = '';

function cycleGraph(maxIterations = 2) {
  return {
    graph_id: 'cycle-g',
    graph_name: 'Cycle Runtime',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    allow_cycles: true,
    max_iterations: maxIterations,
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'b' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'm', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'f', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p2', to_node_id: 'p1' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

__resetSwarmStoreForTests();

let count = 0;
const result = await runSwarmGraph(cycleGraph(3), {
  executePromptNode: async (ctx) => {
    count += 1;
    return { output: `out-${ctx.node.node_id}-${count}` };
  },
});
assert.strictEqual(result.ok, true);
assert.strictEqual(result.run_state, 'completed');
assert.ok(count >= 2, 'cycle scheduler should execute prompt nodes repeatedly as needed');

__resetSwarmStoreForTests();

const exhausted = await runSwarmGraph({
  ...cycleGraph(1),
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'b' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'm', task_lane: 'l', config: { merge_strategy: 'deterministic_priority', priority: ['missing'] } },
    { node_id: 'f1', node_type: 'finalization_node', role_id: 'f', task_lane: 'l', config: {} },
  ],
}, {
  executePromptNode: async (ctx) => ({ output: `x-${ctx.node.node_id}` }),
});
assert.strictEqual(exhausted.ok, false);
assert.ok(
  String(exhausted.error).includes('max_iterations_exhausted')
  || String(exhausted.error).includes('merge_failed')
  || String(exhausted.error).includes('no_priority_branch_valid'),
);

console.log('swarm_cycle_runtime_enforcement test OK');

