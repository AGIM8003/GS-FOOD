import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { runCatalogRefresh } from '../src/models/refresh/runCatalogRefresh.js';
import { readCatalogSnapshot } from '../src/models/catalogStore.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-refresh-'));
const providers = [
  { id: 'groq', pinnedModel: 'a', candidates: ['b'], free_tier_eligible: true, enabled: true },
  { id: 'openrouter', pinnedModel: 'openrouter/free', candidates: [], free_tier_eligible: true, enabled: true },
  { id: 'ollama', pinnedModel: 'llama', candidates: [], enabled: true },
];
const { snapshot, diff } = await runCatalogRefresh({ providers, skipNetwork: true, rootOverride: tmp });
assert.ok(snapshot.models.length >= 3);
assert.ok(diff.counts.added >= 0);
const again = readCatalogSnapshot(tmp);
assert.ok(again?.models?.length);
fs.rmSync(tmp, { recursive: true, force: true });

console.log('model_catalog_refresh test OK');
