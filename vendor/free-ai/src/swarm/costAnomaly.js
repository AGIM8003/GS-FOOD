/**
 * Cost Anomaly Detection.
 *
 * Alerts when a run or node type costs significantly more than the rolling baseline.
 * Tracks historical averages and flags anomalies using z-score thresholds.
 */

const baselines = new Map();
const ANOMALY_THRESHOLD = 3.0;
const MIN_SAMPLES = 5;

function recordCost(key, cost) {
  if (!baselines.has(key)) {
    baselines.set(key, { samples: [], sum: 0, sum_sq: 0, count: 0 });
  }
  const b = baselines.get(key);
  b.samples.push(cost);
  b.sum += cost;
  b.sum_sq += cost * cost;
  b.count++;
  if (b.samples.length > 100) {
    const removed = b.samples.shift();
    b.sum -= removed;
    b.sum_sq -= removed * removed;
    b.count--;
  }
}

function getBaseline(key) {
  const b = baselines.get(key);
  if (!b || b.count < MIN_SAMPLES) return null;
  const mean = b.sum / b.count;
  const variance = (b.sum_sq / b.count) - (mean * mean);
  const stddev = Math.sqrt(Math.max(variance, 0));
  return { mean, stddev, count: b.count };
}

function detectAnomaly(key, currentCost) {
  const baseline = getBaseline(key);
  if (!baseline) return { anomaly: false, reason: 'insufficient_data' };
  if (baseline.stddev < 1e-6) {
    const isAnomaly = currentCost > baseline.mean * 2;
    return { anomaly: isAnomaly, z_score: null, baseline_mean: baseline.mean, current: currentCost };
  }
  const zScore = (currentCost - baseline.mean) / baseline.stddev;
  const isAnomaly = zScore > ANOMALY_THRESHOLD;
  return {
    anomaly: isAnomaly,
    z_score: Math.round(zScore * 100) / 100,
    baseline_mean: Math.round(baseline.mean * 10000) / 10000,
    baseline_stddev: Math.round(baseline.stddev * 10000) / 10000,
    current: currentCost,
    threshold: ANOMALY_THRESHOLD,
  };
}

function checkAndRecordCost(key, cost) {
  const result = detectAnomaly(key, cost);
  recordCost(key, cost);
  return result;
}

function listBaselines() {
  const result = [];
  for (const [key, b] of baselines) {
    const baseline = getBaseline(key);
    result.push({ key, samples: b.count, ...(baseline || {}) });
  }
  return result;
}

function __resetAnomalyForTests() {
  baselines.clear();
}

export { recordCost, getBaseline, detectAnomaly, checkAndRecordCost, listBaselines, ANOMALY_THRESHOLD, __resetAnomalyForTests };
