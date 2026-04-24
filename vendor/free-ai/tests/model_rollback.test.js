import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readFileSync, existsSync } from 'fs';
import { rollbackModelPromotion } from '../src/routing/rollbackModelPromotion.js';
import { promotionHistoryPath } from '../src/models/catalogStore.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-roll-'));
const r = rollbackModelPromotion(
  { provider_id: 'groq', lane: 'default_chat', previous_model_id: 'prev', model_id: 'bad' },
  tmp,
);
assert.strictEqual(r.ok, true);
assert.strictEqual(r.restore.model_id, 'prev');
const p = promotionHistoryPath(tmp);
assert.ok(existsSync(p));
const tail = readFileSync(p, 'utf8').trim();
assert.ok(tail.includes('rollback'));
fs.rmSync(tmp, { recursive: true, force: true });

console.log('model_rollback test OK');
