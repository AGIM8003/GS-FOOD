import assert from 'assert';
import {
  listSwarmReviews,
  getSwarmReviewDetail,
  approveSwarmReview,
  rejectSwarmReview,
  getSwarmPolicySummary,
  getSwarmCheckpoints,
  getSwarmSnapshotsV1,
  getSwarmRunMetricsV1,
  getSwarmRunCostBreakdownV1,
} from '../src/server/admin.js';
import { createReview, __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();
__resetReviewsForTests();

{
  const summary = getSwarmPolicySummary();
  assert.strictEqual(summary.schema_version, 'freeaiSwarmPolicySummary.v1');
  assert.ok(Array.isArray(summary.policy_zones));
  assert.ok(summary.policy_zones.length >= 7);
}

{
  const graph = {
    graph_id: 'tenant-scoped-data',
    graph_name: 'TenantScopedData',
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
  const done = await runSwarmGraph(graph, { executePromptNode: async () => ({ output: 'ok', meta: {} }), tenant_id: 'tenant-z' });
  assert.strictEqual(done.ok, true);
  const runId = done.run_id;

  assert.ok(Array.isArray(getSwarmSnapshotsV1(runId, 'tenant-z')));
  assert.strictEqual(getSwarmSnapshotsV1(runId, 'tenant-other'), null);

  getSwarmRunMetricsV1(runId, 'tenant-z');
  assert.strictEqual(getSwarmRunMetricsV1(runId, 'tenant-other'), null);

  getSwarmRunCostBreakdownV1(runId, 'tenant-z');
  assert.strictEqual(getSwarmRunCostBreakdownV1(runId, 'tenant-other'), null);
}

{
  const rev = createReview({ run_id: 'run-x', node_id: 'n-x', requested_action: 'approve', tenant_id: 'tenant-a' });
  const list = listSwarmReviews('tenant-a');
  assert.ok(list.length >= 1);
  assert.ok(list.some((r) => r.review_id === rev.review_id));

  const detail = getSwarmReviewDetail(rev.review_id, 'tenant-a');
  assert.ok(detail);
  assert.strictEqual(detail.run_id, 'run-x');

  const approved = approveSwarmReview(rev.review_id, { reviewer_id: 'admin' }, 'tenant-a');
  assert.strictEqual(approved.ok, true);
  assert.strictEqual(approved.review.review_status, 'approved');

  const notFound = getSwarmReviewDetail('nonexistent', 'tenant-a');
  assert.strictEqual(notFound, null);
}

{
  const rev2 = createReview({ run_id: 'run-y', node_id: 'n-y', requested_action: 'approve', tenant_id: 'tenant-b' });
  const rejected = rejectSwarmReview(rev2.review_id, { reviewer_id: 'admin', decision_notes: 'bad' }, 'tenant-b');
  assert.strictEqual(rejected.ok, true);
  assert.strictEqual(rejected.review.review_status, 'rejected');
  const crossTenant = getSwarmReviewDetail(rev2.review_id, 'tenant-a');
  assert.strictEqual(crossTenant, null);
}

{
  const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });
  let failOnce = true;
  const failStub = async (ctx) => {
    if (ctx.node.node_id === 'p2' && failOnce) { failOnce = false; throw new Error('fail'); }
    return { output: `out-${ctx.node.node_id}`, meta: {} };
  };

  const graph = {
    graph_id: 'cp-test',
    graph_name: 'CheckpointTest',
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

  const r = await runSwarmGraph(graph, { executePromptNode: failStub });
  assert.strictEqual(r.ok, false);

  const checkpoints = getSwarmCheckpoints();
  assert.ok(checkpoints.some((c) => c.run_id === r.run_id));
  const cp = checkpoints.find((c) => c.run_id === r.run_id);
  assert.strictEqual(cp.execution_checkpoint, 'p1');
  assert.strictEqual(cp.resume_eligible, true);
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

console.log('admin_swarm_operational_control test OK');
