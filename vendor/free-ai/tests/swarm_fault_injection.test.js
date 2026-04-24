import assert from 'assert';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { verifyReceiptChain } from '../src/swarm/receiptChainHmac.js';

process.env.FREEAI_SWARM_PERSIST = '';

__resetSwarmStoreForTests();
__resetReviewsForTests();

const graph = {
  graph_id: 'fault-test',
  graph_name: 'Fault Injection',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: {},
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

{
  const failP1 = async (ctx) => {
    if (ctx.node.node_id === 'p1') throw new Error('injected_fault_p1');
    return { output: 'ok', meta: {} };
  };
  const r = await runSwarmGraph(graph, { executePromptNode: failP1 });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.run_state, 'failed');
  const run = getRun(r.run_id);
  assert.strictEqual(run.failed_at_node_id, 'p1');
  assert.strictEqual(run.resume_eligible, false, 'No checkpoint yet so not resumable');
  assert.ok(run.receipts.length > 0, 'Should still have receipts');
  const chainResult = verifyReceiptChain(run.receipts);
  assert.strictEqual(chainResult.valid, true, 'Receipt chain must be valid even on failure');
}

{
  let callCount = 0;
  const failP2 = async (ctx) => {
    callCount++;
    if (ctx.node.node_id === 'p2') throw new Error('injected_fault_p2');
    return { output: 'ok', meta: {} };
  };
  const r = await runSwarmGraph(graph, { executePromptNode: failP2 });
  assert.strictEqual(r.ok, false);
  const run = getRun(r.run_id);
  assert.strictEqual(run.failed_at_node_id, 'p2');
  assert.strictEqual(run.execution_checkpoint, 'p1');
  assert.strictEqual(run.resume_eligible, true, 'Should be resumable: p1 completed before p2 failed');
  const chainResult = verifyReceiptChain(run.receipts);
  assert.strictEqual(chainResult.valid, true);
}

{
  const throwRandomly = async (ctx) => {
    if (Math.random() < 0.3) throw new Error('random_fault');
    return { output: `out-${ctx.node.node_id}`, meta: {} };
  };
  let faultCount = 0;
  let okCount = 0;
  for (let i = 0; i < 10; i++) {
    const r = await runSwarmGraph({ ...graph, graph_id: `fault-random-${i}` }, { executePromptNode: throwRandomly });
    if (r.ok) okCount++;
    else faultCount++;
    const run = getRun(r.run_id);
    assert.ok(['completed', 'failed'].includes(run.run_state), 'Run must be in terminal state');
    const chainResult = verifyReceiptChain(run.receipts);
    assert.strictEqual(chainResult.valid, true, `Receipt chain must be valid for run ${r.run_id}`);
  }
  assert.ok(faultCount + okCount === 10);
}

__resetSwarmStoreForTests();

console.log('swarm_fault_injection test OK');
