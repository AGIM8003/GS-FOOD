import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { signEnvelope, verifyEnvelope } from '../src/security/signedEnvelopes.js';

describe('signedEnvelopes', () => {
  it('signs and verifies a valid envelope', () => {
    const env = signEnvelope({ decision: 'allow', run_id: 'r1' });
    assert.ok(env.signature);
    assert.ok(env.envelope_id);
    assert.equal(env.schema_version, 'freeaiDecisionEnvelope.v1');
    const v = verifyEnvelope(env);
    assert.equal(v.valid, true);
  });

  it('detects tampered envelope', () => {
    const env = signEnvelope({ decision: 'allow' });
    env.payload.decision = 'deny';
    const v = verifyEnvelope(env);
    assert.equal(v.valid, false);
  });

  it('rejects missing fields', () => {
    const v = verifyEnvelope(null);
    assert.equal(v.valid, false);
    assert.equal(v.reason, 'missing_fields');
  });

  it('rejects envelope without signature', () => {
    const v = verifyEnvelope({ payload: { x: 1 } });
    assert.equal(v.valid, false);
  });
});
