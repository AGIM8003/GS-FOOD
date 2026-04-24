import assert from 'assert';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { replayRunFromCheckpoint } from '../src/swarm/replayRunFromCheckpoint.js';

const env = process.env;
env.FREEAI_SWARM_PERSIST = '';

__resetSwarmStoreForTests();
__resetReviewsForTests();

let failOnce = true;
const stubExec = async (ctx) => {
  if (ctx.node.node_id === 'p2' && failOnce) {
    failOnce = false;
    throw new Error('simulated_failure');
  }
  return { output: `out-${ctx.node.node_id}`, meta: {} };
};

const graph = {
  graph_id: 'resume-graph',
  graph_name: 'Resume Test',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: { q: 'test' },
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'b' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
    { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2' },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
};

const r1 = await runSwarmGraph(graph, { executePromptNode: stubExec });
assert.strictEqual(r1.ok, false, 'First run should fail');
assert.strictEqual(r1.run_state, 'failed');

const run = getRun(r1.run_id);
assert.ok(run.resume_eligible, 'Should be resume eligible');
assert.strictEqual(run.execution_checkpoint, 'p1');
assert.strictEqual(run.failed_at_node_id, 'p2');

const r2 = await replayRunFromCheckpoint(r1.run_id, {
  resumed_by: 'test-admin',
  resume_reason: 'retry after fix',
  executePromptNode: stubExec,
});
assert.strictEqual(r2.ok, true, 'Resume should succeed');
assert.strictEqual(r2.run_state, 'completed');
assert.strictEqual(r2.resumed, true);
assert.strictEqual(r2.resumed_from_checkpoint, 'p1');

const finalRun = getRun(r1.run_id);
assert.strictEqual(finalRun.run_state, 'completed');
assert.ok(finalRun.final_output);
assert.ok(finalRun.receipts.length > 0);
assert.ok(finalRun.receipts.some((r) => r.receipt_type === 'resume_receipt'));
assert.ok(finalRun.receipts.some((r) => r.receipt_type === 'policy_receipt'));

__resetSwarmStoreForTests();
__resetReviewsForTests();

{
  let cycles = 0;
  const cyc = {
    graph_id: 'resume-cycle',
    graph_name: 'Resume Cycle',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    allow_cycles: true,
    max_iterations: 3,
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'b' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p2', to_node_id: 'p1' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };

  const cycResult = await runSwarmGraph(cyc, {
    executePromptNode: async (ctx) => {
      cycles += 1;
      if (ctx.node.node_id === 'p2' && cycles === 2) throw new Error('cyc_fail_once');
      return { output: `cyc-${ctx.node.node_id}-${cycles}` };
    },
  });
  assert.strictEqual(cycResult.ok, false);

  const resumed = await replayRunFromCheckpoint(cycResult.run_id, {
    resumed_by: 'cycle-test',
    resume_reason: 'cycle parity',
    executePromptNode: async (ctx) => ({ output: `resume-${ctx.node.node_id}` }),
  });
  assert.ok(
    resumed.ok
    || String(resumed.error || '').includes('max_iterations_exhausted')
    || String(resumed.error || '').includes('finalization_node_not_reached')
    || String(resumed.error || '').includes('node_not_in_snapshot'),
  );
}

{
  const notResumable = await replayRunFromCheckpoint('nonexistent', { executePromptNode: stubExec });
  assert.strictEqual(notResumable.ok, false);
  assert.ok(notResumable.error.includes('run_not_found'));
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

console.log('swarm_replay_resume test OK');
