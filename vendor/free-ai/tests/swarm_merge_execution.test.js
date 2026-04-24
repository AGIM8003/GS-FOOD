import assert from 'assert';
import { executeMergeV1 } from '../src/swarm/mergeExecutor.js';

{
  const r = executeMergeV1({
    strategy: 'deterministic_priority',
    priority: ['c', 'a', 'b'],
    branches: [
      { node_id: 'a', output: '', ok: true },
      { node_id: 'b', output: 'B', ok: true },
      { node_id: 'c', output: 'C', ok: true },
    ],
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.picked_branch, 'c');
  assert.strictEqual(r.value, 'C');
}

{
  const r = executeMergeV1({
    strategy: 'deterministic_priority',
    priority: ['a', 'b'],
    branches: [
      { node_id: 'a', output: '', ok: true },
      { node_id: 'b', output: 'ok', ok: true },
    ],
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.picked_branch, 'b');
}

{
  const r = executeMergeV1({
    strategy: 'first_valid',
    priority: null,
    branches: [
      { node_id: 'z', output: '', ok: true },
      { node_id: 'a', output: 'first', ok: true },
    ],
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.picked_branch, 'a');
}

{
  const r = executeMergeV1({
    strategy: 'deterministic_priority',
    priority: ['a', 'b'],
    branches: [
      { node_id: 'a', output: '', ok: false },
      { node_id: 'b', output: '', ok: false },
    ],
  });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.picked_branch, null);
}

console.log('swarm_merge_execution test OK');
