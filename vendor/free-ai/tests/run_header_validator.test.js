import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateRunHeader, buildRunHeader } from '../src/security/runHeaderValidator.js';

describe('runHeaderValidator', () => {
  it('validates a complete header', () => {
    const h = buildRunHeader({ run_id: 'r1', graph_id: 'g1', graph_hash: 'h1', tenant_id: 't1' });
    const v = validateRunHeader(h);
    assert.equal(v.valid, true);
    assert.equal(v.errors.length, 0);
  });

  it('rejects missing run_id', () => {
    const v = validateRunHeader({ graph_id: 'g1', graph_hash: 'h1', tenant_id: 't1', initiated_at: new Date().toISOString(), receipt_mode: 'full' });
    assert.equal(v.valid, false);
    assert.ok(v.errors.some((e) => e.includes('run_id')));
  });

  it('rejects non-object', () => {
    const v = validateRunHeader(null);
    assert.equal(v.valid, false);
  });

  it('rejects invalid receipt_mode', () => {
    const h = buildRunHeader({ run_id: 'r1', graph_id: 'g1', graph_hash: 'h1' });
    h.receipt_mode = 'invalid';
    const v = validateRunHeader(h);
    assert.equal(v.valid, false);
  });

  it('rejects stale timestamp', () => {
    const h = buildRunHeader({ run_id: 'r1', graph_id: 'g1', graph_hash: 'h1' });
    h.initiated_at = new Date(Date.now() - 600000).toISOString();
    const v = validateRunHeader(h);
    assert.equal(v.valid, false);
    assert.ok(v.errors.some((e) => e.includes('stale')));
  });
});
