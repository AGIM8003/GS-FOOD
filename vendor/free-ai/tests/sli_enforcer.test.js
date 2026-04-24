import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { initSli, recordNodeSli, finalizeSli, __resetSliForTests } from '../src/swarm/sliEnforcer.js';

describe('sliEnforcer', () => {
  beforeEach(() => __resetSliForTests());

  it('initializes and finalizes with no violations', () => {
    initSli('r1', { max_latency_ms: 10000 });
    recordNodeSli('r1', 'n1', 100, true);
    recordNodeSli('r1', 'n2', 200, true);
    const result = finalizeSli('r1');
    assert.ok(result);
    assert.equal(result.slo_met, true);
    assert.equal(result.violations.length, 0);
    assert.equal(result.success_rate, 1);
  });

  it('detects latency violation', () => {
    initSli('r1', { max_latency_ms: 100 });
    recordNodeSli('r1', 'n1', 500, true);
    const result = finalizeSli('r1');
    assert.ok(result.violations.some((v) => v.type === 'node_latency_exceeded'));
  });

  it('detects error rate violation', () => {
    initSli('r1', { max_error_rate: 0.1 });
    for (let i = 0; i < 5; i++) recordNodeSli('r1', `n${i}`, 50, true);
    for (let i = 0; i < 3; i++) recordNodeSli('r1', `f${i}`, 50, false);
    const result = finalizeSli('r1');
    assert.equal(result.slo_met, false);
    assert.ok(result.violations.some((v) => v.type === 'error_rate_above_slo'));
  });

  it('detects success rate below SLO', () => {
    initSli('r1', { min_success_rate: 0.95 });
    for (let i = 0; i < 5; i++) recordNodeSli('r1', `n${i}`, 50, true);
    for (let i = 0; i < 3; i++) recordNodeSli('r1', `f${i}`, 50, false);
    const result = finalizeSli('r1');
    assert.ok(result.violations.some((v) => v.type === 'success_rate_below_slo'));
  });

  it('returns null for unknown run', () => {
    assert.equal(finalizeSli('unknown'), null);
  });
});
