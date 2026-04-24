import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initBudget, getBudget, checkBudget, consumeBudget, clearBudget, __resetBudgetsForTests } from '../src/swarm/tokenBudget.js';

describe('tokenBudget', () => {
  beforeEach(() => __resetBudgetsForTests());

  it('initializes budget', () => {
    initBudget('r1', { max_tokens: 50000, max_cost: 0.5 });
    const b = getBudget('r1');
    assert.ok(b);
    assert.equal(b.max_tokens, 50000);
    assert.equal(b.status, 'active');
  });

  it('allows within budget', () => {
    initBudget('r1', { max_tokens: 10000 });
    const r = checkBudget('r1', 5000, 0.01);
    assert.equal(r.allowed, true);
  });

  it('blocks when token budget exhausted', () => {
    initBudget('r1', { max_tokens: 100 });
    const r = checkBudget('r1', 200, 0);
    assert.equal(r.allowed, false);
    assert.ok(r.reason.includes('token_budget'));
  });

  it('blocks when cost budget exhausted', () => {
    initBudget('r1', { max_cost: 0.1 });
    const r = checkBudget('r1', 0, 0.2);
    assert.equal(r.allowed, false);
    assert.ok(r.reason.includes('cost_budget'));
  });

  it('warns when approaching limit', () => {
    initBudget('r1', { max_tokens: 1000, warn_at_percent: 80, degrade_at_percent: 95 });
    consumeBudget('r1', 750, 0);
    const r = checkBudget('r1', 100, 0);
    assert.equal(r.allowed, true);
    assert.equal(r.warning, true);
  });

  it('degrades near limit', () => {
    initBudget('r1', { max_tokens: 1000, degrade_at_percent: 90 });
    consumeBudget('r1', 850, 0);
    const r = checkBudget('r1', 100, 0);
    assert.equal(r.allowed, true);
    assert.equal(r.degraded, true);
  });

  it('clears budget', () => {
    initBudget('r1', {});
    clearBudget('r1');
    assert.equal(getBudget('r1'), null);
  });

  it('allows when no budget set', () => {
    const r = checkBudget('no-budget', 10000, 1);
    assert.equal(r.allowed, true);
  });
});
