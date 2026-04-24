/**
 * Compliance-Evidence Binding.
 *
 * Binds each swarm run to compliance requirements (SOC2, GDPR, HIPAA)
 * and produces audit-ready evidence records linking decisions to policies.
 */

const COMPLIANCE_FRAMEWORKS = {
  SOC2: {
    controls: ['CC6.1-access-control', 'CC6.2-logical-access', 'CC7.1-change-management', 'CC8.1-system-operations'],
    retention_days: 365,
  },
  GDPR: {
    controls: ['Art5-data-minimization', 'Art13-transparency', 'Art17-right-to-erasure', 'Art25-data-protection-by-design'],
    retention_days: 1095,
  },
  HIPAA: {
    controls: ['164.312-access-control', '164.312-audit-controls', '164.312-integrity', '164.312-transmission-security'],
    retention_days: 2190,
  },
};

function createComplianceRecord(runId, framework, evidence) {
  const fw = COMPLIANCE_FRAMEWORKS[framework];
  if (!fw) return { ok: false, error: `unknown_framework: ${framework}` };

  return {
    ok: true,
    record: {
      schema_version: 'freeaiComplianceBinding.v1',
      run_id: runId,
      framework,
      controls_covered: fw.controls,
      evidence_items: evidence || [],
      bound_at: new Date().toISOString(),
      retention_until: new Date(Date.now() + fw.retention_days * 86400000).toISOString(),
    },
  };
}

function validateComplianceCoverage(records, requiredFrameworks) {
  const covered = new Set(records.map((r) => r.framework));
  const missing = requiredFrameworks.filter((f) => !covered.has(f));
  return { complete: missing.length === 0, missing, covered: [...covered] };
}

function listFrameworks() {
  return Object.entries(COMPLIANCE_FRAMEWORKS).map(([name, cfg]) => ({
    framework: name,
    controls_count: cfg.controls.length,
    retention_days: cfg.retention_days,
  }));
}

export { createComplianceRecord, validateComplianceCoverage, listFrameworks, COMPLIANCE_FRAMEWORKS };
