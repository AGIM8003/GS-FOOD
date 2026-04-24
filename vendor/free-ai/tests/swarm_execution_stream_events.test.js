import assert from 'assert';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { replayRunFromCheckpoint } from '../src/swarm/replayRunFromCheckpoint.js';
import { createExecutionStream, emitExecutionEvent } from '../src/swarm/executionStream.js';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';

process.env.FREEAI_SWARM_PERSIST = '';
__resetSwarmStoreForTests();

const graph = {
  graph_id: 'g-stream-events',
  graph_name: 'Stream Events',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: {},
  nodes: [
    { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'A' } },
    { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'lane', config: { prompt: 'B' } },
    { node_id: 'f1', node_type: 'finalization_node', config: { is_final: true } },
  ],
  edges: [
    { from_node_id: 'p1', to_node_id: 'p2' },
    { from_node_id: 'p2', to_node_id: 'f1' },
  ],
};

{
  const events = [];
  const runIdProbe = 'probe-stream-run';
  const stream = createExecutionStream(runIdProbe);
  const unsub = stream.subscribe((e) => events.push(e));
  unsub();
  assert.ok(Array.isArray(events));
}

{
  const runIdProbe = 'probe-multi-subscriber-run';
  const stream = createExecutionStream(runIdProbe);
  const a = [];
  const b = [];
  const unsubA = stream.subscribe((e) => a.push(e));
  stream.subscribe((e) => b.push(e));
  unsubA();
  emitExecutionEvent(runIdProbe, { event: 'probe_event' });
  assert.strictEqual(a.length, 0, 'unsubscribed stream should not receive events');
  assert.strictEqual(b.length, 1, 'active subscriber should keep receiving events');
}

let first = true;
const failOncePrompt = async ({ node }) => {
  if (node.node_id === 'p2' && first) {
    first = false;
    throw new Error('forced_failure');
  }
  return { output: `ok-${node.node_id}`, meta: {} };
};

const runResult = await runSwarmGraph(graph, { executePromptNode: failOncePrompt, tenant_id: 't1' });
assert.strictEqual(runResult.ok, false);

const events = [];
const stream = createExecutionStream(runResult.run_id);
stream.subscribe((e) => events.push(e));

const resumeResult = await replayRunFromCheckpoint(runResult.run_id, {
  resumed_by: 'tester',
  resume_reason: 'recover',
  executePromptNode: async ({ node }) => ({ output: `ok-${node.node_id}`, meta: {} }),
});

assert.strictEqual(resumeResult.ok, true);
const eventTypes = events.map((e) => e.event);
assert.ok(eventTypes.includes('run_resume_requested'));
assert.ok(eventTypes.includes('run_resumed'));
assert.ok(eventTypes.includes('node_started'));
assert.ok(eventTypes.includes('node_finished'));
assert.ok(eventTypes.includes('run_completed'));

const run = getRun(runResult.run_id);
assert.strictEqual(run.run_state, 'completed');

__resetSwarmStoreForTests();
console.log('swarm_execution_stream_events test OK');
