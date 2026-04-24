/**
 * Per-node observability metrics for swarm execution.
 *
 * Tracks: latency, token usage, cost attribution, retry counts,
 * and waste tokens per node and per run.
 */

const runMetrics = new Map();

function ensureRun(runId) {
  if (!runMetrics.has(runId)) {
    runMetrics.set(runId, {
      run_id: runId,
      started_at: Date.now(),
      nodes: {},
      totals: {
        total_latency_ms: 0,
        total_tokens: 0,
        total_cost: 0,
        total_retries: 0,
        waste_tokens: 0,
        productive_tokens: 0,
        node_count: 0,
      },
    });
  }
  return runMetrics.get(runId);
}

/**
 * Record the start of a node execution.
 */
function startNodeMetric(runId, nodeId, nodeType) {
  const run = ensureRun(runId);
  run.nodes[nodeId] = {
    node_id: nodeId,
    node_type: nodeType,
    started_at: Date.now(),
    ended_at: null,
    latency_ms: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    cost: 0,
    retries: 0,
    waste_tokens: 0,
    status: 'running',
    error: null,
  };
  return run.nodes[nodeId];
}

/**
 * Record completion of a node execution.
 */
function endNodeMetric(runId, nodeId, result) {
  const run = runMetrics.get(runId);
  if (!run || !run.nodes[nodeId]) return null;

  const metric = run.nodes[nodeId];
  metric.ended_at = Date.now();
  metric.latency_ms = metric.ended_at - metric.started_at;
  metric.status = result.ok !== false ? 'completed' : 'failed';
  metric.error = result.error || null;

  if (result.input_tokens) metric.input_tokens = result.input_tokens;
  if (result.output_tokens) metric.output_tokens = result.output_tokens;
  metric.total_tokens = metric.input_tokens + metric.output_tokens;

  if (result.cost) metric.cost = result.cost;
  if (typeof result.retries === 'number') metric.retries = result.retries;
  if (typeof result.waste_tokens === 'number') metric.waste_tokens = result.waste_tokens;

  run.totals.total_latency_ms += metric.latency_ms;
  run.totals.total_tokens += metric.total_tokens;
  run.totals.total_cost += metric.cost;
  run.totals.total_retries += metric.retries;
  run.totals.waste_tokens += metric.waste_tokens;
  run.totals.productive_tokens += metric.total_tokens - metric.waste_tokens;
  run.totals.node_count++;

  return metric;
}

/**
 * Record a retry event on a node (increments waste tokens).
 */
function recordRetry(runId, nodeId, wasteTokens) {
  const run = runMetrics.get(runId);
  if (!run || !run.nodes[nodeId]) return;
  run.nodes[nodeId].retries++;
  run.nodes[nodeId].waste_tokens += (wasteTokens || 0);
}

/**
 * Get metrics for a specific node.
 */
function getNodeMetric(runId, nodeId) {
  const run = runMetrics.get(runId);
  if (!run) return null;
  return run.nodes[nodeId] || null;
}

/**
 * Get aggregated metrics for a run.
 */
function getRunMetrics(runId) {
  const run = runMetrics.get(runId);
  if (!run) return null;

  const wasteRatio = run.totals.total_tokens > 0
    ? (run.totals.waste_tokens / run.totals.total_tokens)
    : 0;

  return {
    run_id: runId,
    started_at: new Date(run.started_at).toISOString(),
    elapsed_ms: Date.now() - run.started_at,
    nodes: Object.values(run.nodes),
    totals: {
      ...run.totals,
      waste_ratio: Math.round(wasteRatio * 10000) / 10000,
    },
  };
}

/**
 * Get a cost breakdown per node for a run.
 */
function getCostBreakdown(runId) {
  const run = runMetrics.get(runId);
  if (!run) return null;

  const nodes = Object.values(run.nodes).map((n) => ({
    node_id: n.node_id,
    node_type: n.node_type,
    latency_ms: n.latency_ms,
    tokens: n.total_tokens,
    cost: n.cost,
    retries: n.retries,
    waste_tokens: n.waste_tokens,
    status: n.status,
  }));

  return {
    run_id: runId,
    nodes: nodes.sort((a, b) => b.cost - a.cost),
    totals: run.totals,
  };
}

function __resetNodeMetricsForTests() {
  runMetrics.clear();
}

export {
  startNodeMetric,
  endNodeMetric,
  recordRetry,
  getNodeMetric,
  getRunMetrics,
  getCostBreakdown,
  __resetNodeMetricsForTests,
};
