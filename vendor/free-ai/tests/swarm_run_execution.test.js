import assert from 'assert';
import path from 'path';
import { mkdirSync, readdirSync, rmSync } from 'fs';
import os from 'os';

const dir = path.join(os.tmpdir(), `freeai-swarm-run-exec-${Date.now()}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
process.env.FREEAI_SWARM_RUNS_DIR = dir;
process.env.FREEAI_SWARM_PERSIST = '1';

const { runSwarmGraph } = await import('../src/swarm/runSwarmGraph.js');
const { __resetSwarmStoreForTests, getRun, __reloadSwarmStoreFromDiskForTests } = await import('../src/swarm/graphStateStore.js');

function graphLinear() {
  return {
    graph_id: 'lin',
    graph_name: 'lin',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: { k: 1 },
    nodes: [
      {
        node_id: 'p1',
        node_type: 'prompt_node',
        role_id: 'r',
        task_lane: 'l',
        config: { prompt: 'a' },
      },
      {
        node_id: 'm1',
        node_type: 'merge_node',
        role_id: 'm',
        task_lane: 'l',
        config: { merge_strategy: 'first_valid' },
      },
      {
        node_id: 'f1',
        node_type: 'finalization_node',
        role_id: 'f',
        task_lane: 'l',
        config: {},
      },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

function graphTwoBranch() {
  return {
    graph_id: 'fan',
    graph_name: 'fan',
    entry_node_id: 'p1',
    receipt_mode: 'summary',
    input_payload: {},
    nodes: [
      {
        node_id: 'p1',
        node_type: 'prompt_node',
        role_id: 'r1',
        task_lane: 'l',
        config: { prompt: 'root' },
      },
      {
        node_id: 'p2',
        node_type: 'prompt_node',
        role_id: 'r2',
        task_lane: 'l',
        config: { prompt: 'b2' },
      },
      {
        node_id: 'p3',
        node_type: 'prompt_node',
        role_id: 'r3',
        task_lane: 'l',
        config: { prompt: 'b3' },
      },
      {
        node_id: 'm1',
        node_type: 'merge_node',
        role_id: 'm',
        task_lane: 'l',
        config: { merge_strategy: 'deterministic_priority', priority: ['p3', 'p2'] },
      },
      {
        node_id: 'f1',
        node_type: 'finalization_node',
        role_id: 'f',
        task_lane: 'l',
        config: {},
      },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p1', to_node_id: 'p3' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'p3', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

const stubExec = async (ctx) => ({ output: `stub:${ctx.node.node_id}` });

__resetSwarmStoreForTests();
{
  const out = await runSwarmGraph(graphLinear(), { executePromptNode: stubExec });
  assert.strictEqual(out.ok, true);
  assert.ok(out.final_output?.text?.includes('stub:p1'));
  assert.ok(out.run_id);
  const files = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
  assert.ok(files.includes(`${out.run_id}.json`), 'run JSON should exist on disk');
}

__resetSwarmStoreForTests();
{
  const out = await runSwarmGraph(graphTwoBranch(), { executePromptNode: stubExec });
  assert.strictEqual(out.ok, true);
  assert.ok(out.final_output?.text?.includes('stub:p3'));
  const run = getRun(out.run_id);
  const mergeRc = run.receipts.filter((x) => x.receipt_type === 'merge_receipt');
  assert.strictEqual(mergeRc.length, 1);
  assert.ok(mergeRc[0].summary.includes('p3'));
  assert.strictEqual(run.execution_checkpoint, 'f1');
}

__resetSwarmStoreForTests();
{
  const out = await runSwarmGraph(graphLinear(), { executePromptNode: stubExec });
  const rid = out.run_id;
  __reloadSwarmStoreFromDiskForTests();
  const again = getRun(rid);
  assert.ok(again);
  assert.strictEqual(again.run_state, 'completed');
  assert.ok((again.receipts || []).length >= 2);
}

console.log('swarm_run_execution test OK');
