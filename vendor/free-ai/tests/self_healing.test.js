import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerPreflightCheck, runPreflight, suggestHealingAction, getHealingLog, __resetSelfHealingForTests } from '../src/swarm/selfHealing.js';

describe('selfHealing', () => {
  beforeEach(() => __resetSelfHealingForTests());

  it('runs preflight checks', async () => {
    registerPreflightCheck('has_nodes', (g) => ({ passed: g.nodes && g.nodes.length > 0 }));
    const r = await runPreflight({ nodes: [{ node_id: 'n1' }] });
    assert.equal(r.ok, true);
    assert.equal(r.total, 1);
  });

  it('fails preflight when check fails', async () => {
    registerPreflightCheck('always_fail', () => ({ passed: false, details: 'bad graph' }));
    const r = await runPreflight({});
    assert.equal(r.ok, false);
  });

  it('handles check that throws', async () => {
    registerPreflightCheck('throws', () => { throw new Error('boom'); });
    const r = await runPreflight({});
    assert.equal(r.ok, false);
    assert.ok(r.checks[0].details.includes('boom'));
  });

  it('suggests skip for persistent failures', () => {
    const failures = Array.from({ length: 5 }, (_, i) => ({ timestamp: Date.now() - i * 1000 }));
    const r = suggestHealingAction('n1', failures);
    assert.equal(r.action, 'skip_node');
  });

  it('suggests retry for intermittent failure', () => {
    const r = suggestHealingAction('n1', [{ timestamp: Date.now() }]);
    assert.equal(r.action, 'retry_with_fallback');
  });

  it('suggests none with no failures', () => {
    const r = suggestHealingAction('n1', []);
    assert.equal(r.action, 'none');
  });

  it('logs healing actions', () => {
    suggestHealingAction('n1', [{ timestamp: Date.now() }]);
    assert.ok(getHealingLog().length > 0);
  });
});
