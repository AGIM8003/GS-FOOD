import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import * as store from '../src/swarm/graphStateStore.js';

store.__resetSwarmStoreForTests();

const executionOrder = [];

const graph = {
  graph_id: 'g-parallel',
  graph_name: 'Parallel Test',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: { text: 'hello' },
  parallel: true,
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Start' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'BranchA' } },
    { node_id: 'p3', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'BranchB' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
    { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2' },
    { from_node_id: 'p1', to_node_id: 'p3' },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'p3', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
};

const result = await runSwarmGraph(graph, {
  executePromptNode: async (ctx) => {
    executionOrder.push(ctx.node.node_id);
    await new Promise((r) => setTimeout(r, 10));
    return { output: `out-${ctx.node.node_id}`, meta: {} };
  },
});

assert.ok(result.ok, `run should succeed: ${result.error}`);
assert.strictEqual(result.run_state, 'completed');

// p1 must execute first (entry), p2 and p3 are on same level so they run concurrently
assert.strictEqual(executionOrder[0], 'p1', 'p1 should be first');
assert.ok(executionOrder.includes('p2'), 'p2 should execute');
assert.ok(executionOrder.includes('p3'), 'p3 should execute');

// Verify all nodes completed
const run = store.getRun(result.run_id);
assert.strictEqual(run.node_states['p1'], 'completed');
assert.strictEqual(run.node_states['p2'], 'completed');
assert.strictEqual(run.node_states['p3'], 'completed');
assert.strictEqual(run.node_states['m1'], 'completed');
assert.strictEqual(run.node_states['f1'], 'completed');

// Test with parallel=false (sequential mode)
store.__resetSwarmStoreForTests();
const seqOrder = [];
const seqGraph = { ...graph, parallel: false };
const seqResult = await runSwarmGraph(seqGraph, {
  executePromptNode: async (ctx) => {
    seqOrder.push(ctx.node.node_id);
    return { output: `out-${ctx.node.node_id}`, meta: {} };
  },
});
assert.ok(seqResult.ok, 'sequential should succeed');
assert.strictEqual(seqOrder[0], 'p1');
assert.strictEqual(seqOrder.length, 3, 'should have 3 prompt executions');

console.log('PASS: parallel_execution');
