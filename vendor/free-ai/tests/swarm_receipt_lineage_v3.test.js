import assert from 'assert';
import { SWARM_RECEIPT_TYPES, isValidSwarmReceiptV1 } from '../src/swarm/swarmReceiptSchema.js';
import { buildSwarmReceiptV1 } from '../src/swarm/writeSwarmReceipt.js';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';

process.env.FREEAI_SWARM_PERSIST = '';

assert.ok(SWARM_RECEIPT_TYPES.includes('policy_receipt'));
assert.ok(SWARM_RECEIPT_TYPES.includes('review_receipt'));
assert.ok(SWARM_RECEIPT_TYPES.includes('resume_receipt'));
assert.ok(SWARM_RECEIPT_TYPES.includes('tool_receipt'));

for (const type of SWARM_RECEIPT_TYPES) {
  const r = buildSwarmReceiptV1({
    receipt_type: type,
    run_id: 'r1',
    graph_id: 'g1',
    node_id: 'n1',
    status: 'ok',
    summary: 'test',
    inputs: {},
    outputs: {},
    duration_ms: 0,
  });
  assert.ok(isValidSwarmReceiptV1(r), `${type} should be valid`);
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });

const graph = {
  graph_id: 'lineage-test',
  graph_name: 'Lineage',
  entry_node_id: 'p1',
  receipt_mode: 'full',
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

const result = await runSwarmGraph(graph, { executePromptNode: stubExec });
assert.strictEqual(result.ok, true);

const run = getRun(result.run_id);
assert.ok(run.receipts.length >= 4, `Expected at least 4 receipts, got ${run.receipts.length}`);

const types = run.receipts.map((r) => r.receipt_type);
assert.ok(types.includes('policy_receipt'), 'Should have policy_receipt for graph admission');
assert.ok(types.includes('graph_receipt'));
assert.ok(types.includes('node_receipt'));
assert.ok(types.includes('merge_receipt'));
assert.ok(types.includes('final_receipt'));

for (const r of run.receipts) {
  assert.ok(isValidSwarmReceiptV1(r), `Receipt ${r.receipt_id} fails validation`);
  assert.strictEqual(r.run_id, result.run_id);
  assert.strictEqual(r.graph_id, 'lineage-test');
}

__resetSwarmStoreForTests();

console.log('swarm_receipt_lineage_v3 test OK');
