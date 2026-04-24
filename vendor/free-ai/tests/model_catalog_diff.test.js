import assert from 'assert';
import { computeCatalogDiff } from '../src/models/catalogDiff.js';
import { normalizeModelRecord } from '../src/models/modelRecordSchema.js';

const prev = {
  generated_at: 'a',
  models: [normalizeModelRecord({ provider_id: 'x', model_id: 'old', status: 'stable' })],
};
const next = {
  generated_at: 'b',
  models: [
    normalizeModelRecord({ provider_id: 'x', model_id: 'old', status: 'deprecated' }),
    normalizeModelRecord({ provider_id: 'x', model_id: 'new', status: 'stable' }),
  ],
};
const d = computeCatalogDiff(prev, next);
assert.strictEqual(d.counts.added, 1);
assert.strictEqual(d.counts.removed, 0);
assert.strictEqual(d.counts.changed, 1);

console.log('model_catalog_diff test OK');
