import assert from 'assert';
import { evaluatePolicy } from '../src/policy/policyFabric.js';

{
  const r = evaluatePolicy('human_review_decision', {
    action: 'approve',
    review: { review_status: 'pending' },
    payload: { reviewer_id: 'alice' },
  });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('human_review_decision', {
    action: 'reject',
    review: { review_status: 'pending' },
    payload: { reviewer_id: 'alice', decision_notes: '' },
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'reject_notes_required');
}

{
  process.env.FREEAI_ALLOWED_PROVIDERS = 'openai,anthropic';
  const r = evaluatePolicy('provider_model_eligibility', {
    node: { config: { provider_id: 'unknown-provider', model_id: 'x' } },
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'provider_not_allowlisted');
  delete process.env.FREEAI_ALLOWED_PROVIDERS;
}

{
  process.env.FREEAI_DENIED_MODELS = 'bad-model';
  const r = evaluatePolicy('provider_model_eligibility', {
    node: { config: { provider_id: 'openai', model_id: 'bad-model' } },
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'model_denied');
  delete process.env.FREEAI_DENIED_MODELS;
}

console.log('policy_strict_zones test OK');

