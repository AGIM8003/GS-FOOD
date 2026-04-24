import assert from 'assert';
import path from 'path';
import { mkdirSync, readdirSync, rmSync, readFileSync } from 'fs';
import os from 'os';

const dir = path.join(os.tmpdir(), `freeai-swarm-persist-${Date.now()}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
process.env.FREEAI_SWARM_RUNS_DIR = dir;
process.env.FREEAI_SWARM_PERSIST = '1';

const { runSwarmGraph } = await import('../src/swarm/runSwarmGraph.js');
const { __resetSwarmStoreForTests, getRun, __reloadSwarmStoreFromDiskForTests } = await import(
  '../src/swarm/graphStateStore.js'
);

const graph = {
  graph_id: 'persist-g',
  graph_name: 'persist',
  entry_node_id: 'p1',
  receipt_mode: 'full',
  input_payload: {},
  nodes: [
    {
      node_id: 'p1',
      node_type: 'prompt_node',
      role_id: 'r',
      task_lane: 'l',
      config: { prompt: 'x' },
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

__resetSwarmStoreForTests();

const out = await runSwarmGraph(graph, {
  executePromptNode: async () => ({ output: 'durable-out' }),
});
assert.strictEqual(out.ok, true);
const rid = out.run_id;

const jsonFiles = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('.'));
assert.ok(jsonFiles.includes(`${rid}.json`));

const disk = JSON.parse(readFileSync(path.join(dir, `${rid}.json`), 'utf8'));
assert.strictEqual(disk.schema_version, 'freeaiSwarmRunRecord.v2');
assert.ok(Array.isArray(disk.receipts));
assert.strictEqual(disk.execution_checkpoint, 'f1');

__reloadSwarmStoreFromDiskForTests();
const mem = getRun(rid);
assert.ok(mem);
assert.strictEqual(mem.final_output?.text, 'durable-out');

__resetSwarmStoreForTests();

console.log('swarm_persistence test OK');
