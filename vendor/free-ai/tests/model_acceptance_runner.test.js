import assert from 'assert';
import { runModelAcceptanceGates } from '../src/eval/modelAcceptanceRunner.js';
import { normalizeModelRecord } from '../src/models/modelRecordSchema.js';

const pass = runModelAcceptanceGates({
  model: normalizeModelRecord({ provider_id: 'groq', model_id: 'ok', promotion_status: 'discovered' }),
  lane: 'default_chat',
});
assert.strictEqual(pass.pass_fail, 'pass');

const fail = runModelAcceptanceGates({
  model: normalizeModelRecord({
    provider_id: 'groq',
    model_id: 'bad',
    promotion_status: 'canary',
    benchmark_status: 'not_run',
  }),
  lane: 'default_chat',
});
assert.strictEqual(fail.pass_fail, 'fail');

console.log('model_acceptance_runner test OK');
