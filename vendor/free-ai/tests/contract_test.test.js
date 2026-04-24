import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateResponseContract, getContractRegistry, addContract } from '../src/swarm/contractTest.js';

describe('contractTest', () => {
  it('validates correct response', () => {
    const r = validateResponseContract('/health', 'GET', { status: 'ok', version: '1.0' }, 200);
    assert.equal(r.valid, true);
  });

  it('detects missing field', () => {
    const r = validateResponseContract('/health', 'GET', { status: 'ok' }, 200);
    assert.equal(r.valid, false);
    assert.ok(r.errors.some((e) => e.includes('version')));
  });

  it('detects wrong status code', () => {
    const r = validateResponseContract('/health', 'GET', { status: 'ok', version: '1.0' }, 500);
    assert.equal(r.valid, false);
  });

  it('passes for uncontracted path', () => {
    const r = validateResponseContract('/unknown', 'GET', {}, 200);
    assert.equal(r.valid, true);
    assert.equal(r.reason, 'no_contract_defined');
  });

  it('registry has expected contracts', () => {
    const reg = getContractRegistry();
    assert.ok(reg.length >= 5);
    assert.ok(reg.some((c) => c.path === '/health'));
  });

  it('can add custom contract', () => {
    const before = getContractRegistry().length;
    addContract({ path: '/custom', method: 'GET', expected: { fields: ['data'], status_code: 200 } });
    assert.equal(getContractRegistry().length, before + 1);
  });
});
