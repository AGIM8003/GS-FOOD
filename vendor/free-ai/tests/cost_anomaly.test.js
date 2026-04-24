import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { recordCost, getBaseline, detectAnomaly, checkAndRecordCost, listBaselines, __resetAnomalyForTests } from '../src/swarm/costAnomaly.js';

describe('costAnomaly', () => {
  beforeEach(() => __resetAnomalyForTests());

  it('returns null baseline with insufficient data', () => {
    recordCost('key1', 0.1);
    assert.equal(getBaseline('key1'), null);
  });

  it('computes baseline after enough samples', () => {
    for (let i = 0; i < 10; i++) recordCost('k', 0.1);
    const b = getBaseline('k');
    assert.ok(b);
    assert.ok(Math.abs(b.mean - 0.1) < 0.001);
  });

  it('detects anomaly', () => {
    for (let i = 0; i < 10; i++) recordCost('k', 0.1);
    const r = detectAnomaly('k', 10.0);
    assert.equal(r.anomaly, true);
  });

  it('reports no anomaly for normal cost', () => {
    for (let i = 0; i < 10; i++) recordCost('k', 0.1);
    const r = detectAnomaly('k', 0.11);
    assert.equal(r.anomaly, false);
  });

  it('checkAndRecordCost records and returns result', () => {
    for (let i = 0; i < 10; i++) recordCost('k', 0.1);
    const r = checkAndRecordCost('k', 0.1);
    assert.equal(r.anomaly, false);
  });

  it('lists baselines', () => {
    for (let i = 0; i < 10; i++) recordCost('a', 0.1);
    for (let i = 0; i < 10; i++) recordCost('b', 0.5);
    const list = listBaselines();
    assert.equal(list.length, 2);
  });
});
