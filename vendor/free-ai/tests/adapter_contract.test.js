import assert from 'assert';
import { validateAdapterCallResult, inferFreeTierEligible } from '../src/providers/adapterContract.js';

assert.strictEqual(validateAdapterCallResult({ ok: true, text: 'hi' }).valid, true);
assert.strictEqual(validateAdapterCallResult({ ok: true }).valid, false);
assert.strictEqual(validateAdapterCallResult({ ok: false, error_class: 'rate_limited' }).valid, true);
assert.strictEqual(validateAdapterCallResult({ ok: false }).valid, false);

assert.strictEqual(inferFreeTierEligible({ tier: 'paid', free_tier_eligible: false }), false);
assert.strictEqual(inferFreeTierEligible({ tier: 'paid' }), false);
assert.strictEqual(inferFreeTierEligible({ tier: 'free-focused' }), true);
assert.strictEqual(inferFreeTierEligible({ id: 'ollama', tier: 'unknown' }), true);

console.log('adapter_contract test OK');
