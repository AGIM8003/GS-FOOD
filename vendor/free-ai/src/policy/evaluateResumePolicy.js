export function evaluateResumePolicy(ctx) {
  const { run, graph_hash } = ctx || {};
  const zone = 'resume_execution';

  if (!run) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_run',
      summary: 'No run record for resume evaluation',
      remediation: 'Provide a valid run record',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!run.resume_eligible) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'not_resume_eligible',
      summary: `Run ${run.run_id} is not eligible for resume`,
      remediation: 'Run must have failed with a valid checkpoint to be resumable',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!run.execution_checkpoint) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_checkpoint',
      summary: 'No execution checkpoint stored for resume',
      remediation: 'Run must have completed at least one node before failing',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (graph_hash && run.graph_hash !== graph_hash) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'graph_hash_mismatch',
      summary: 'Graph hash does not match the original run',
      remediation: 'Resume must use the same graph definition',
      evaluated_at: new Date().toISOString(),
    };
  }

  if (!run.graph_snapshot) {
    return {
      policy_id: `pol-${zone}-${Date.now()}`,
      policy_zone: zone,
      decision: 'deny',
      blocking: true,
      reason_code: 'missing_graph_snapshot',
      summary: 'Graph snapshot not stored; cannot verify replay safety',
      remediation: 'Run must have a stored graph_snapshot for safe replay',
      evaluated_at: new Date().toISOString(),
    };
  }

  return {
    policy_id: `pol-${zone}-${Date.now()}`,
    policy_zone: zone,
    decision: 'allow',
    blocking: false,
    reason_code: 'resume_allowed',
    summary: `Resume allowed for run ${run.run_id} from checkpoint ${run.execution_checkpoint}`,
    remediation: null,
    evaluated_at: new Date().toISOString(),
  };
}
