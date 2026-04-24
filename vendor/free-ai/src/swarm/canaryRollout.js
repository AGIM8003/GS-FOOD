/**
 * Canary Rollout Engine.
 *
 * Gradual graph version rollout: runs new graph version on a configurable
 * percentage of traffic, compares SLI vs. baseline, auto-promotes or rolls back.
 */

const canaries = new Map();

function createCanary(graphId, newVersion, config = {}) {
  const canary = {
    canary_id: `canary-${graphId}-${Date.now()}`,
    graph_id: graphId,
    new_version: newVersion,
    traffic_percent: config.initial_percent || 5,
    max_percent: config.max_percent || 100,
    step_percent: config.step_percent || 10,
    step_interval_ms: config.step_interval_ms || 60000,
    rollback_on_error_rate: config.rollback_on_error_rate || 0.1,
    status: 'active',
    started_at: new Date().toISOString(),
    runs_baseline: 0,
    runs_canary: 0,
    errors_baseline: 0,
    errors_canary: 0,
  };
  canaries.set(canary.canary_id, canary);
  return canary;
}

function shouldUseCanary(graphId) {
  for (const c of canaries.values()) {
    if (c.graph_id === graphId && c.status === 'active') {
      return Math.random() * 100 < c.traffic_percent;
    }
  }
  return false;
}

function recordCanaryResult(canaryId, isCanary, success) {
  const c = canaries.get(canaryId);
  if (!c) return;
  if (isCanary) {
    c.runs_canary++;
    if (!success) c.errors_canary++;
  } else {
    c.runs_baseline++;
    if (!success) c.errors_baseline++;
  }
}

function evaluateCanary(canaryId) {
  const c = canaries.get(canaryId);
  if (!c) return { ok: false, error: 'canary_not_found' };

  const canaryErrorRate = c.runs_canary > 0 ? c.errors_canary / c.runs_canary : 0;
  const baselineErrorRate = c.runs_baseline > 0 ? c.errors_baseline / c.runs_baseline : 0;

  if (canaryErrorRate > c.rollback_on_error_rate) {
    c.status = 'rolled_back';
    return { action: 'rollback', reason: 'canary_error_rate_exceeded', canary_error_rate: canaryErrorRate };
  }

  if (canaryErrorRate <= baselineErrorRate && c.runs_canary >= 10) {
    if (c.traffic_percent < c.max_percent) {
      c.traffic_percent = Math.min(c.traffic_percent + c.step_percent, c.max_percent);
      return { action: 'promote', new_traffic_percent: c.traffic_percent };
    }
    c.status = 'promoted';
    return { action: 'full_promotion', message: 'canary graduated to 100%' };
  }

  return { action: 'hold', canary_error_rate: canaryErrorRate, baseline_error_rate: baselineErrorRate };
}

function listCanaries() {
  return [...canaries.values()];
}

function __resetCanariesForTests() {
  canaries.clear();
}

export { createCanary, shouldUseCanary, recordCanaryResult, evaluateCanary, listCanaries, __resetCanariesForTests };
