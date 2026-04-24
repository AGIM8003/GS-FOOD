import assert from 'assert';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';

process.env.FREEAI_SWARM_PERSIST = '';

const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });

function makeGraph(receiptMode) {
  return {
    graph_id: `mode-${receiptMode}`,
    graph_name: `Mode ${receiptMode}`,
    entry_node_id: 'p1',
    receipt_mode: receiptMode,
    input_payload: {},
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

{
  __resetSwarmStoreForTests();
  __resetReviewsForTests();
  const r = await runSwarmGraph(makeGraph('full'), { executePromptNode: stubExec });
  assert.strictEqual(r.ok, true);
  const run = getRun(r.run_id);
  assert.ok(run.receipts.length >= 4, 'full mode should store all receipts');
  assert.ok(run.receipts[0].summary, 'full mode receipts should have summary');
}

{
  __resetSwarmStoreForTests();
  __resetReviewsForTests();
  const r = await runSwarmGraph(makeGraph('summary'), { executePromptNode: stubExec });
  assert.strictEqual(r.ok, true);
  const run = getRun(r.run_id);
  assert.ok(run.receipts.length >= 4, 'summary mode should store receipts');
  for (const receipt of run.receipts) {
    assert.ok(receipt.inputs_hash, 'summary mode receipts should have inputs_hash');
    assert.ok(receipt.outputs_hash, 'summary mode receipts should have outputs_hash');
    assert.ok(receipt.chain_hmac, 'summary mode receipts should have chain_hmac');
  }
}

{
  __resetSwarmStoreForTests();
  __resetReviewsForTests();
  const r = await runSwarmGraph(makeGraph('none'), { executePromptNode: stubExec });
  assert.strictEqual(r.ok, true);
  const run = getRun(r.run_id);
  assert.strictEqual(run.receipts.length, 0, 'none mode should store zero receipts');
}

__resetSwarmStoreForTests();

console.log('receipt_mode_behavior test OK');
