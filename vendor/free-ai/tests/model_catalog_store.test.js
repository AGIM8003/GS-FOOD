import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { writeCatalogSnapshot, readCatalogSnapshot } from '../src/models/catalogStore.js';
import { normalizeModelRecord } from '../src/models/modelRecordSchema.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-mcp-'));
const snap = {
  overall_status: 'OK',
  generated_at: new Date().toISOString(),
  models: [normalizeModelRecord({ provider_id: 'p', model_id: 'm', promotion_status: 'discovered' })],
};
writeCatalogSnapshot(snap, tmp);
const readBack = readCatalogSnapshot(tmp);
assert.ok(readBack);
assert.strictEqual(readBack.models.length, 1);
assert.strictEqual(readBack.models[0].model_id, 'm');
fs.rmSync(tmp, { recursive: true, force: true });

console.log('model_catalog_store test OK');
