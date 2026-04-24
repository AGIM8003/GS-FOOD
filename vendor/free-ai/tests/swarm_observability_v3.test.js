import assert from 'assert';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { getSwarmTraceSummary } from '../src/server/admin.js';
import { computeCompositeHealthScore } from '../src/observability/compositeHealth.js';
import { buildSwarmReceiptV1 } from '../src/swarm/writeSwarmReceipt.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();
__resetReviewsForTests();

{
  const r = buildSwarmReceiptV1({
    receipt_type: 'node_receipt',
    run_id: 'r1',
    graph_id: 'g1',
    node_id: 'n1',
    status: 'ok',
    summary: 'test',
    parent_receipt_id: 'sr-parent-123',
  });
  assert.strictEqual(r.parent_receipt_id, 'sr-parent-123');
}

{
  const r = buildSwarmReceiptV1({
    receipt_type: 'node_receipt',
    run_id: 'r1',
    graph_id: 'g1',
    status: 'ok',
    summary: 'test',
  });
  assert.strictEqual(r.parent_receipt_id, null);
}

const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });
const graph = {
  graph_id: 'obs-test',
  graph_name: 'Observability',
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
assert.ok(run.receipts.some((r) => r.receipt_type === 'policy_receipt'), 'Should have policy receipts');
assert.ok(run.receipts.every((r) => 'parent_receipt_id' in r), 'All receipts should have parent_receipt_id field');

{
  const summary = await getSwarmTraceSummary();
  assert.strictEqual(summary.schema_version, 'freeaiSwarmTraceSummary.v1');
  assert.ok(summary.traces.length >= 1);
  const trace = summary.traces.find((t) => t.run_id === result.run_id);
  assert.ok(trace);
  assert.ok(trace.has_policy_receipts);
  assert.ok(trace.receipt_count >= 4);
}

{
  const health = computeCompositeHealthScore(
    [
      { event: 'request_handled', status: 200 },
      { event: 'swarm_run_handled', ok: true },
      { event: 'swarm_run_handled', ok: false },
    ],
    {},
  );
  assert.ok(typeof health.health_score === 'number');
  assert.strictEqual(health.components.swarm_run_ratio_0_100, 50);
  assert.strictEqual(health.components.swarm_handled_sample, 2);
}

__resetSwarmStoreForTests();

console.log('swarm_observability_v3 test OK');
