import { validate, listSchemas } from '../src/schemaValidator.js';

function assert(cond, msg){ if (!cond) throw new Error(msg||'assertion failed'); }

// quick smoke: validate a minimal request receipt
const good = {
  receipt_id: 'r-1',
  trace_id: 't-1',
  provider_id: 'p-x',
  model_id: 'm-1',
  http_status: 200,
  fallback_used: false,
  kb_short_circuit: false,
  persona: { id: 'general', version: 'v1' },
  intent_family: 'general',
  skills_loaded: [],
  latency_ms: 12,
  timestamp: new Date().toISOString(),
  schema_version: 'requestReceipt.v1'
};

const r1 = validate('requestReceipt', good);
console.log('requestReceipt good valid=', r1.valid);
assert(r1.valid, 'expected requestReceipt valid');

const bad = Object.assign({}, good);
delete bad.receipt_id;
const r2 = validate('requestReceipt', bad);
console.log('requestReceipt missing receipt_id valid=', r2.valid, 'errors=', r2.errors);
assert(!r2.valid, 'expected invalid when missing receipt_id');

console.log('Schemas available:', listSchemas());
console.log('schema.test.js OK');
