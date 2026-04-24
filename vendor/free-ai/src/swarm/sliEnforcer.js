/**
 * SLI/SLO Enforcement.
 *
 * Tracks Service Level Indicators per swarm run and compares against
 * configurable SLO targets. Flags violations for alerting.
 */

const DEFAULT_SLO = {
  max_latency_ms: 30000,
  min_success_rate: 0.95,
  max_error_rate: 0.05,
  max_p99_latency_ms: 60000,
};

const sliRecords = new Map();

function initSli(runId, sloConfig) {
  const slo = { ...DEFAULT_SLO, ...sloConfig };
  sliRecords.set(runId, {
    run_id: runId,
    slo,
    node_latencies: [],
    successes: 0,
    failures: 0,
    started_at: Date.now(),
    completed_at: null,
    violations: [],
  });
}

function recordNodeSli(runId, nodeId, latencyMs, success) {
  const rec = sliRecords.get(runId);
  if (!rec) return;
  rec.node_latencies.push({ node_id: nodeId, latency_ms: latencyMs });
  if (success) rec.successes++;
  else rec.failures++;

  if (latencyMs > rec.slo.max_latency_ms) {
    rec.violations.push({ type: 'node_latency_exceeded', node_id: nodeId, value: latencyMs, limit: rec.slo.max_latency_ms });
  }
}

function finalizeSli(runId) {
  const rec = sliRecords.get(runId);
  if (!rec) return null;
  rec.completed_at = Date.now();

  const totalNodes = rec.successes + rec.failures;
  const successRate = totalNodes > 0 ? rec.successes / totalNodes : 1;
  const errorRate = totalNodes > 0 ? rec.failures / totalNodes : 0;

  if (successRate < rec.slo.min_success_rate) {
    rec.violations.push({ type: 'success_rate_below_slo', value: successRate, limit: rec.slo.min_success_rate });
  }
  if (errorRate > rec.slo.max_error_rate) {
    rec.violations.push({ type: 'error_rate_above_slo', value: errorRate, limit: rec.slo.max_error_rate });
  }

  const latencies = rec.node_latencies.map((l) => l.latency_ms).sort((a, b) => a - b);
  const p99Index = Math.floor(latencies.length * 0.99);
  const p99 = latencies[p99Index] || 0;
  if (p99 > rec.slo.max_p99_latency_ms) {
    rec.violations.push({ type: 'p99_latency_exceeded', value: p99, limit: rec.slo.max_p99_latency_ms });
  }

  const totalLatency = rec.completed_at - rec.started_at;
  return {
    run_id: runId,
    total_latency_ms: totalLatency,
    node_count: totalNodes,
    success_rate: Math.round(successRate * 10000) / 10000,
    error_rate: Math.round(errorRate * 10000) / 10000,
    p99_latency_ms: p99,
    slo_met: rec.violations.length === 0,
    violations: rec.violations,
  };
}

function getSli(runId) {
  return sliRecords.get(runId) || null;
}

function __resetSliForTests() {
  sliRecords.clear();
}

export { initSli, recordNodeSli, finalizeSli, getSli, DEFAULT_SLO, __resetSliForTests };
