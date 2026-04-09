import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { makeReceipt } from '../src/receipts.js';

const evidenceDir = path.join(process.cwd(), 'evidence', 'receipts');
const ledgerPath = path.join(evidenceDir, 'ledger.jsonl');

if (fs.existsSync(ledgerPath)) fs.unlinkSync(ledgerPath);

const first = makeReceipt({
  provider_id: 'test-provider',
  model_id: 'test-model',
  http_status: 200,
  persona: { id: 'default', version: 'v1' },
  intent: { intent_family: 'question' },
  skills: [],
  trace_id: 't-chain-1',
  latency_ms: 1,
});

const second = makeReceipt({
  provider_id: 'test-provider',
  model_id: 'test-model',
  http_status: 200,
  persona: { id: 'default', version: 'v1' },
  intent: { intent_family: 'question' },
  skills: [],
  trace_id: 't-chain-2',
  latency_ms: 1,
});

assert(first.receipt_chain);
assert(second.receipt_chain);
assert.equal(first.receipt_chain.ledger_seq, 0);
assert.equal(second.receipt_chain.ledger_seq, 1);
assert.equal(second.receipt_chain.prev_hash, first.receipt_chain.this_hash);

const ledgerLines = fs.readFileSync(ledgerPath, 'utf8').trim().split('\n').filter(Boolean);
assert.equal(ledgerLines.length, 2);
console.log('receipt chain test OK');