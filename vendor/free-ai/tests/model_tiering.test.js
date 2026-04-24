import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelTier, getModelHintsForTier, estimateCostMultiplier, listTiers } from '../src/swarm/modelTiering.js';

describe('modelTiering', () => {
  it('resolves default to standard', () => {
    const r = resolveModelTier({}, {});
    assert.equal(r.tier, 'standard');
  });

  it('resolves node-level tier', () => {
    const r = resolveModelTier({ model_tier: 'economy' }, {});
    assert.equal(r.tier, 'economy');
  });

  it('resolves graph-level default', () => {
    const r = resolveModelTier({}, { default_model_tier: 'premium' });
    assert.equal(r.tier, 'premium');
  });

  it('node tier overrides graph default', () => {
    const r = resolveModelTier({ model_tier: 'reasoning' }, { default_model_tier: 'economy' });
    assert.equal(r.tier, 'reasoning');
  });

  it('returns models for tier', () => {
    const models = getModelHintsForTier('economy');
    assert.ok(models.length > 0);
  });

  it('returns empty for unknown tier', () => {
    assert.equal(getModelHintsForTier('unknown').length, 0);
  });

  it('estimates cost multiplier', () => {
    assert.equal(estimateCostMultiplier({ model_tier: 'economy' }, {}), 0.1);
    assert.equal(estimateCostMultiplier({ model_tier: 'premium' }, {}), 3.0);
  });

  it('lists all tiers', () => {
    const tiers = listTiers();
    assert.ok(tiers.length >= 4);
    assert.ok(tiers.some((t) => t.tier_id === 'reasoning'));
  });
});
