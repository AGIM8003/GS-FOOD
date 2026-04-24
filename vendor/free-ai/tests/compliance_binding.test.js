import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createComplianceRecord, validateComplianceCoverage, listFrameworks } from '../src/swarm/complianceBinding.js';

describe('complianceBinding', () => {
  it('creates SOC2 compliance record', () => {
    const r = createComplianceRecord('run1', 'SOC2', ['evidence1']);
    assert.equal(r.ok, true);
    assert.equal(r.record.framework, 'SOC2');
    assert.ok(r.record.controls_covered.length > 0);
    assert.ok(r.record.retention_until);
  });

  it('creates GDPR compliance record', () => {
    const r = createComplianceRecord('run1', 'GDPR', []);
    assert.equal(r.ok, true);
    assert.equal(r.record.framework, 'GDPR');
  });

  it('rejects unknown framework', () => {
    const r = createComplianceRecord('run1', 'UNKNOWN', []);
    assert.equal(r.ok, false);
  });

  it('validates complete coverage', () => {
    const records = [{ framework: 'SOC2' }, { framework: 'GDPR' }];
    const v = validateComplianceCoverage(records, ['SOC2', 'GDPR']);
    assert.equal(v.complete, true);
    assert.equal(v.missing.length, 0);
  });

  it('detects missing coverage', () => {
    const records = [{ framework: 'SOC2' }];
    const v = validateComplianceCoverage(records, ['SOC2', 'HIPAA']);
    assert.equal(v.complete, false);
    assert.ok(v.missing.includes('HIPAA'));
  });

  it('lists frameworks', () => {
    const fws = listFrameworks();
    assert.ok(fws.length >= 3);
    assert.ok(fws.some((f) => f.framework === 'HIPAA'));
  });
});
