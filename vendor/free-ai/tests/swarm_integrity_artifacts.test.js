import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { getRun, __resetSwarmStoreForTests } from '../src/swarm/graphStateStore.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();

const graph = {
  graph_id: 'integrity-test',
  graph_name: 'IntegrityTest',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: {},
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r1', task_lane: 'lane1', config: { prompt: 'hello' } },
    { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'lane2', config: {} },
  ],
  edges: [{ from_node_id: 'p1', to_node_id: 'f1' }],
};

const stubExec = async () => ({ output: 'ok', meta: {} });

{
  const result = await runSwarmGraph(graph, { executePromptNode: stubExec, tenant_id: 'tenant-x' });
  assert.strictEqual(result.ok, true);
  const run = getRun(result.run_id);
  assert.ok(run);
  assert.ok(run.integrity_artifacts);
  assert.ok(run.integrity_artifacts.run_header);
  assert.strictEqual(run.integrity_artifacts.run_header.run_id, result.run_id);
  assert.ok(run.integrity_artifacts.merkle_seal);
  assert.ok(run.integrity_artifacts.merkle_seal.merkle_root);
  assert.ok(run.integrity_artifacts.decision_envelope);
  assert.strictEqual(run.integrity_artifacts.decision_envelope_verified, true);
}

{
  let failOnce = true;
  const failExec = async () => {
    if (failOnce) {
      failOnce = false;
      throw new Error('forced_failure');
    }
    return { output: 'ok', meta: {} };
  };
  const failGraph = {
    ...graph,
    graph_id: 'integrity-fail-test',
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r1', task_lane: 'lane1', config: { prompt: 'hello' } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r2', task_lane: 'lane1', config: { prompt: 'hello2' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'lane2', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p2', to_node_id: 'f1' },
    ],
  };
  const failResult = await runSwarmGraph(failGraph, { executePromptNode: failExec, tenant_id: 'tenant-y' });
  assert.strictEqual(failResult.ok, false);
  const failedRun = getRun(failResult.run_id);
  assert.ok(failedRun?.integrity_artifacts?.run_header);
  assert.ok(failedRun?.integrity_artifacts?.decision_envelope);
}

__resetSwarmStoreForTests();
console.log('swarm_integrity_artifacts test OK');
