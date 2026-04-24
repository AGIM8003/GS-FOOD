import assert from 'assert';
import { L2Cache } from '../src/cache/l2.js';

async function run() {
  const l2 = L2Cache(true, 0.5);
  await l2.upsert('hello world test phrase', { id: 'p1', version: '1' }, [{ id: 's1' }], 'cached answer one', 'tenant-a');
  const hit = await l2.findSimilar('hello world test phrase extra', { id: 'p1', version: '1' }, [{ id: 's1' }], 'tenant-a');
  assert.ok(hit && hit.text === 'cached answer one', 'expected L2 hit for similar prompt');
  const miss = await l2.findSimilar('totally unrelated topic about zebras', { id: 'p1', version: '1' }, [{ id: 's1' }], 'tenant-a');
  assert.strictEqual(miss, null, 'expected no L2 hit');
  const wrongTenant = await l2.findSimilar('hello world test phrase', { id: 'p1', version: '1' }, [{ id: 's1' }], 'tenant-b');
  assert.strictEqual(wrongTenant, null, 'tenant isolation');
  console.log('l2_cache.test ok');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
