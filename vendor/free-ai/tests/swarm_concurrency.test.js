import assert from 'assert';
import { __resetSwarmStoreForTests, getRun, listRuns } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();
__resetReviewsForTests();

const stubExec = async (ctx) => {
  await new Promise((r) => setTimeout(r, Math.random() * 5));
  return { output: `out-${ctx.node.node_id}`, meta: {} };
};

function makeGraph(i) {
  return {
    graph_id: `conc-${i}`,
    graph_name: `Concurrent ${i}`,
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: { i },
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: `c${i}` } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

const N = 10;
const promises = [];
for (let i = 0; i < N; i++) {
  promises.push(runSwarmGraph(makeGraph(i), { executePromptNode: stubExec }));
}

const results = await Promise.all(promises);

let completed = 0;
const runIds = new Set();
for (const r of results) {
  assert.ok(r.run_id, 'Each result must have a run_id');
  assert.ok(!runIds.has(r.run_id), `Duplicate run_id: ${r.run_id}`);
  runIds.add(r.run_id);
  if (r.ok) completed++;
}

assert.strictEqual(completed, N, `All ${N} concurrent runs should complete`);

const allRuns = listRuns();
assert.ok(allRuns.length >= N, `Store should have at least ${N} runs`);

for (const r of results) {
  const run = getRun(r.run_id);
  assert.strictEqual(run.run_state, 'completed');
  assert.ok(run.final_output);
  assert.ok(run.receipts.length >= 4, `Run ${r.run_id} should have at least 4 receipts`);
  assert.strictEqual(run.graph_id, `conc-${run.graph_snapshot.input_payload.i}`);
}

__resetSwarmStoreForTests();

console.log('swarm_concurrency test OK');
