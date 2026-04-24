/**
 * Secure Skill Gateway.
 *
 * Capability-based access control for tools and skills.
 * Each skill must declare required capabilities; the gateway
 * validates them before granting execution.
 */

const skillRegistry = new Map();
const capabilityGrants = new Map();

function registerSkill(skillId, descriptor) {
  if (!descriptor.name) throw new Error('skill requires name');
  skillRegistry.set(skillId, {
    skill_id: skillId,
    name: descriptor.name,
    version: descriptor.version || '1.0.0',
    required_capabilities: descriptor.required_capabilities || [],
    safety_rating: descriptor.safety_rating || 'standard',
    checksum: descriptor.checksum || null,
    registered_at: new Date().toISOString(),
    invocation_count: 0,
    last_invoked: null,
  });
}

function grantCapability(principalId, capability) {
  if (!capabilityGrants.has(principalId)) capabilityGrants.set(principalId, new Set());
  capabilityGrants.get(principalId).add(capability);
}

function revokeCapability(principalId, capability) {
  if (capabilityGrants.has(principalId)) {
    capabilityGrants.get(principalId).delete(capability);
  }
}

function checkAccess(principalId, skillId) {
  const skill = skillRegistry.get(skillId);
  if (!skill) return { allowed: false, reason: 'skill_not_found' };
  if (skill.required_capabilities.length === 0) return { allowed: true, reason: 'no_capabilities_required' };

  const grants = capabilityGrants.get(principalId) || new Set();
  const missing = skill.required_capabilities.filter((c) => !grants.has(c));
  return {
    allowed: missing.length === 0,
    reason: missing.length === 0 ? 'all_capabilities_granted' : 'missing_capabilities',
    missing,
  };
}

function invokeSkill(principalId, skillId) {
  const access = checkAccess(principalId, skillId);
  if (!access.allowed) return { ok: false, ...access };
  const skill = skillRegistry.get(skillId);
  skill.invocation_count++;
  skill.last_invoked = new Date().toISOString();
  return { ok: true, skill_id: skillId, name: skill.name };
}

function detectSkillDrift(skillId, currentChecksum) {
  const skill = skillRegistry.get(skillId);
  if (!skill || !skill.checksum) return { drifted: false, reason: 'no_baseline_checksum' };
  const drifted = skill.checksum !== currentChecksum;
  return {
    drifted,
    reason: drifted ? 'checksum_mismatch' : 'checksums_match',
    expected: skill.checksum,
    actual: currentChecksum,
  };
}

function listSkills() {
  return [...skillRegistry.values()].map((s) => ({
    skill_id: s.skill_id,
    name: s.name,
    version: s.version,
    safety_rating: s.safety_rating,
    invocation_count: s.invocation_count,
  }));
}

function __resetSkillGatewayForTests() {
  skillRegistry.clear();
  capabilityGrants.clear();
}

export {
  registerSkill, grantCapability, revokeCapability, checkAccess, invokeSkill,
  detectSkillDrift, listSkills, __resetSkillGatewayForTests,
};
