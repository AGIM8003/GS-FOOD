import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createCanary, shouldUseCanary, recordCanaryResult, evaluateCanary, listCanaries, __resetCanariesForTests } from '../src/swarm/canaryRollout.js';

describe('canaryRollout', () => {
  beforeEach(() => __resetCanariesForTests());

  it('creates canary', () => {
    const c = createCanary('graph1', 'v2', { initial_percent: 10 });
    assert.ok(c.canary_id);
    assert.equal(c.status, 'active');
    assert.equal(c.traffic_percent, 10);
  });

  it('evaluates to hold with few samples', () => {
    const c = createCanary('graph1', 'v2');
    const e = evaluateCanary(c.canary_id);
    assert.equal(e.action, 'hold');
  });

  it('rolls back on high error rate', () => {
    const c = createCanary('graph1', 'v2', { rollback_on_error_rate: 0.1 });
    for (let i = 0; i < 10; i++) recordCanaryResult(c.canary_id, true, false);
    const e = evaluateCanary(c.canary_id);
    assert.equal(e.action, 'rollback');
  });

  it('promotes when canary performs well', () => {
    const c = createCanary('graph1', 'v2', { initial_percent: 5, step_percent: 10 });
    for (let i = 0; i < 15; i++) recordCanaryResult(c.canary_id, true, true);
    for (let i = 0; i < 5; i++) recordCanaryResult(c.canary_id, false, true);
    const e = evaluateCanary(c.canary_id);
    assert.equal(e.action, 'promote');
    assert.equal(e.new_traffic_percent, 15);
  });

  it('lists canaries', () => {
    createCanary('g1', 'v2');
    createCanary('g2', 'v3');
    assert.equal(listCanaries().length, 2);
  });

  it('returns error for unknown canary', () => {
    const e = evaluateCanary('unknown');
    assert.equal(e.ok, false);
  });
});
