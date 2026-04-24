import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerSkill, grantCapability, revokeCapability, checkAccess, invokeSkill, detectSkillDrift, listSkills, __resetSkillGatewayForTests } from '../src/swarm/skillGateway.js';

describe('skillGateway', () => {
  beforeEach(() => __resetSkillGatewayForTests());

  it('registers skill', () => {
    registerSkill('s1', { name: 'Calculator', required_capabilities: ['math'] });
    assert.equal(listSkills().length, 1);
  });

  it('grants and checks capability', () => {
    registerSkill('s1', { name: 'Calc', required_capabilities: ['math'] });
    grantCapability('user1', 'math');
    const r = checkAccess('user1', 's1');
    assert.equal(r.allowed, true);
  });

  it('blocks missing capability', () => {
    registerSkill('s1', { name: 'Calc', required_capabilities: ['math', 'advanced'] });
    grantCapability('user1', 'math');
    const r = checkAccess('user1', 's1');
    assert.equal(r.allowed, false);
    assert.ok(r.missing.includes('advanced'));
  });

  it('allows skill with no required capabilities', () => {
    registerSkill('s1', { name: 'Open', required_capabilities: [] });
    const r = checkAccess('anyone', 's1');
    assert.equal(r.allowed, true);
  });

  it('invokes skill and increments count', () => {
    registerSkill('s1', { name: 'Tool', required_capabilities: [] });
    const r = invokeSkill('user1', 's1');
    assert.equal(r.ok, true);
    assert.equal(listSkills()[0].invocation_count, 1);
  });

  it('blocks invocation without capability', () => {
    registerSkill('s1', { name: 'Secret', required_capabilities: ['admin'] });
    const r = invokeSkill('user1', 's1');
    assert.equal(r.ok, false);
  });

  it('detects skill drift', () => {
    registerSkill('s1', { name: 'Tool', checksum: 'abc123' });
    const r = detectSkillDrift('s1', 'def456');
    assert.equal(r.drifted, true);
  });

  it('confirms no drift', () => {
    registerSkill('s1', { name: 'Tool', checksum: 'abc123' });
    const r = detectSkillDrift('s1', 'abc123');
    assert.equal(r.drifted, false);
  });

  it('revokes capability', () => {
    registerSkill('s1', { name: 'Tool', required_capabilities: ['math'] });
    grantCapability('user1', 'math');
    revokeCapability('user1', 'math');
    const r = checkAccess('user1', 's1');
    assert.equal(r.allowed, false);
  });
});
