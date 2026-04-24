import assert from 'assert';
import { defaultPoliciesForMode, TASK_LANES } from '../src/routing/modelSelectionPolicy.js';
import { selectModelCandidate, orderModelsForProvider } from '../src/routing/selectModelCandidate.js';

const p = defaultPoliciesForMode('PINNED_ONLY');
assert.ok(p.default_chat);
assert.ok(TASK_LANES.includes('default_chat'));

const providers = [{ id: 'groq', enabled: true, pinnedModel: 'llama-3.1-8b-instant', candidates: [] }];
const snap = { models: [] };
const c1 = selectModelCandidate({ ctx: {}, providers, catalogSnapshot: snap, policyMode: 'PINNED_ONLY' });
assert.strictEqual(c1.source, 'explicit_pin');

const promotedSnap = {
  models: [
    {
      provider_id: 'groq',
      model_id: 'new-hot',
      promotion_status: 'promoted',
      status: 'stable',
      canonical_name: 'x',
      release_channel: 'stable',
    },
  ],
};
const c2 = selectModelCandidate({ ctx: {}, providers, catalogSnapshot: promotedSnap, policyMode: 'AUTO_PROMOTE_GOVERNED' });
assert.strictEqual(c2.source, 'promoted_catalog');

const row = { id: 'groq', pinnedModel: 'pin-a', candidates: ['pin-b'] };
const ordDefault = orderModelsForProvider(row, c2, 'PINNED_ONLY');
assert.deepStrictEqual(ordDefault, ['pin-a', 'pin-b']);
const ordAuto = orderModelsForProvider(row, c2, 'AUTO_PROMOTE_GOVERNED');
assert.strictEqual(ordAuto[0], 'new-hot');

const freeTierSnap = {
  models: [
    {
      provider_id: 'groq',
      model_id: 'llama-3.1-8b-instant',
      promotion_status: 'candidate',
      status: 'stable',
      free_tier_eligible: true,
      discovered_at: '2026-04-01T00:00:00.000Z',
      last_verified_at: '2026-04-01T01:00:00.000Z',
    },
    {
      provider_id: 'groq',
      model_id: 'llama-3.3-70b-versatile',
      promotion_status: 'candidate',
      status: 'stable',
      free_tier_eligible: true,
      discovered_at: '2026-04-02T00:00:00.000Z',
      last_verified_at: '2026-04-02T01:00:00.000Z',
    },
  ],
};
const c3 = selectModelCandidate({
  ctx: { budget: 'free' },
  providers,
  catalogSnapshot: freeTierSnap,
  policyMode: 'LATEST_ALIAS_ALLOWED',
});
assert.strictEqual(c3.source, 'free_tier_catalog_scored');
assert.strictEqual(c3.model_id, 'llama-3.3-70b-versatile');

const c4 = selectModelCandidate({
  ctx: { budget: 'free' },
  providers,
  catalogSnapshot: {
    models: [
      {
        provider_id: 'groq',
        model_id: 'llama-old',
        promotion_status: 'candidate',
        status: 'stable',
        deprecation_status: 'deprecated',
        free_tier_eligible: true,
        last_verified_at: '2026-04-03T01:00:00.000Z',
      },
      {
        provider_id: 'groq',
        model_id: 'llama-new',
        promotion_status: 'promoted',
        benchmark_status: 'pass',
        status: 'stable',
        deprecation_status: 'none',
        free_tier_eligible: true,
        last_verified_at: '2026-04-02T01:00:00.000Z',
      },
    ],
  },
  policyMode: 'LATEST_ALIAS_ALLOWED',
});
assert.strictEqual(c4.source, 'free_tier_catalog_scored');
assert.strictEqual(c4.model_id, 'llama-new');

console.log('model_selection_policy test OK');
