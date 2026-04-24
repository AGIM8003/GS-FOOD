import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { enableChaos, disableChaos, isChaosEnabled, shouldInjectChaos, getChaosConfig, __resetChaosForTests } from '../src/swarm/chaosTest.js';

describe('chaosTest', () => {
  beforeEach(() => __resetChaosForTests());

  it('starts disabled', () => {
    assert.equal(isChaosEnabled(), false);
  });

  it('enables chaos', () => {
    enableChaos({ failure_rate: 0.5 });
    assert.equal(isChaosEnabled(), true);
  });

  it('disables chaos', () => {
    enableChaos();
    disableChaos();
    assert.equal(isChaosEnabled(), false);
  });

  it('does not inject when disabled', () => {
    const r = shouldInjectChaos('prompt_node', 'n1');
    assert.equal(r.inject, false);
  });

  it('respects target_node_types filter', () => {
    enableChaos({ failure_rate: 1.0, target_node_types: ['tool_node'] });
    const r = shouldInjectChaos('prompt_node', 'n1');
    assert.equal(r.inject, false);
  });

  it('injects failure when rate is 1.0', () => {
    enableChaos({ failure_rate: 1.0 });
    const r = shouldInjectChaos('prompt_node', 'n1');
    assert.equal(r.inject, true);
    assert.ok(r.effects.some((e) => e.type === 'failure'));
  });

  it('injects latency', () => {
    enableChaos({ latency_injection_ms: 100 });
    const r = shouldInjectChaos('prompt_node', 'n1');
    assert.equal(r.inject, true);
    assert.ok(r.effects.some((e) => e.type === 'latency' && e.delay_ms === 100));
  });

  it('returns config', () => {
    enableChaos({ failure_rate: 0.3 });
    const c = getChaosConfig();
    assert.equal(c.enabled, true);
    assert.equal(c.failure_rate, 0.3);
  });
});
