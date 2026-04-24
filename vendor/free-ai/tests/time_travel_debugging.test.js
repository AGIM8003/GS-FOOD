import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import * as store from '../src/swarm/graphStateStore.js';

store.__resetSwarmStoreForTests();

const graph = {
  graph_id: 'g-tt',
  graph_name: 'Time Travel Test',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: { text: 'hello' },
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'Go2' } },
    { node_id: 'm1', node_type: 'merge_node', role_id: 'r', config: { merge_strategy: 'first_valid' } },
    { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2' },
    { from_node_id: 'p1', to_node_id: 'm1' },
    { from_node_id: 'p2', to_node_id: 'm1' },
    { from_node_id: 'm1', to_node_id: 'f1' },
  ],
};

const result = await runSwarmGraph(graph, {
  executePromptNode: async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} }),
});
assert.ok(result.ok, 'run should succeed');

const runId = result.run_id;
const snaps = store.getSnapshots(runId);
assert.ok(snaps.length >= 3, `expected >=3 snapshots (one per checkpoint), got ${snaps.length}`);

for (const s of snaps) {
  assert.ok(s.snapshot_id, 'snapshot should have id');
  assert.ok(s.checkpoint_node_id, 'snapshot should have checkpoint_node_id');
  assert.ok(s.timestamp, 'snapshot should have timestamp');
  assert.ok(s.node_states, 'snapshot should have node_states');
  assert.ok(typeof s.receipts_count === 'number', 'snapshot should have receipts_count');
}

const first = snaps[0];
assert.ok(first.receipts_count < snaps[snaps.length - 1].receipts_count, 'later snapshots should have more receipts');

// Snapshots at each checkpoint should show progressive completion
const completedCounts = snaps.map((s) => Object.values(s.node_states).filter((st) => st === 'completed').length);
for (let i = 1; i < completedCounts.length; i++) {
  assert.ok(completedCounts[i] >= completedCounts[i - 1], 'completed node count should be monotonically increasing');
}

// getSnapshotByIndex
assert.ok(store.getSnapshotByIndex(runId, 0)?.snapshot_id === snaps[0].snapshot_id);
assert.ok(store.getSnapshotByIndex(runId, -1) === null);
assert.ok(store.getSnapshotByIndex(runId, 999) === null);
assert.ok(store.getSnapshotByIndex('nonexistent', 0) === null);

// Rewind: only works on failed/resumable runs — completed run should fail
const rewindBad = store.rewindToSnapshot(runId, 0);
assert.ok(!rewindBad.ok, 'rewind on completed run should fail');
assert.ok(rewindBad.error.includes('cannot_rewind'));

// Test rewind on a failed run
store.__resetSwarmStoreForTests();

let failCount = 0;
const result2 = await runSwarmGraph(graph, {
  executePromptNode: async (ctx) => {
    failCount++;
    if (failCount === 2) throw new Error('injected_failure');
    return { output: `out-${ctx.node.node_id}`, meta: {} };
  },
});
assert.ok(!result2.ok, 'run should fail');

const runId2 = result2.run_id;
const snaps2 = store.getSnapshots(runId2);
assert.ok(snaps2.length >= 1, 'should have at least 1 snapshot before failure');

const rewindOk = store.rewindToSnapshot(runId2, 0);
assert.ok(rewindOk.ok, 'rewind on failed run should succeed');
assert.ok(rewindOk.snapshot_id);

const rewound = store.getRun(runId2);
assert.ok(rewound.resume_eligible, 'after rewind, resume_eligible should be true');
assert.strictEqual(rewound.execution_checkpoint, snaps2[0].checkpoint_node_id);

console.log('PASS: time_travel_debugging');
