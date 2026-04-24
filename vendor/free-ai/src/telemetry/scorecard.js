import fs from 'fs/promises';
import path from 'path';

const METRICS_PATH = path.join(process.cwd(), 'data', 'metrics.log');

/**
 * Scorecard Cache
 * Key: model_id
 * Value: { schema_failures: number, critic_rejections: number, total_uses: number }
 */
let scorecardData = {};
let lastParseTimestamp = 0;

/**
 * Asynchronously parse the metrics log and aggregate values by model.
 */
export async function updateScorecards() {
  try {
    const data = await fs.readFile(METRICS_PATH, 'utf-8');
    const lines = data.split('\n').filter(Boolean);

    const now = Date.now();
    const newScorecard = {};

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        // Only process events newer than an hour for active routing context
        // OR process all for simplicity here. We process all for now.
        const modelId = parsed.model_id || parsed.model_name;
        if (!modelId) continue;

        if (!newScorecard[modelId]) {
          newScorecard[modelId] = { schema_failures: 0, critic_rejections: 0, total_uses: 0 };
        }

        if (parsed.event === 'schema_repair_failure') newScorecard[modelId].schema_failures++;
        if (parsed.event === 'critic_node_rejection') newScorecard[modelId].critic_rejections++;
        
        // Count uses based on known generic event boundaries (e.g., node completed/failed)
        if (['schema_repair_success', 'schema_repair_failure', 'freeai.swarm.node.completed'].includes(parsed.event)) {
          newScorecard[modelId].total_uses++;
        }
      } catch (e) {
        // malformed line, skip
      }
    }

    scorecardData = newScorecard;
    lastParseTimestamp = now;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[Scorecard] Failed to parse metrics logs:', err.message);
    }
  }
}

/**
 * Get the reliability score for a given model.
 * @returns {number} Score between 0.0 (unreliable) and 1.0 (reliable)
 */
export function getModelReliabilityScore(modelId) {
  const modelStats = scorecardData[modelId];
  if (!modelStats) return 1.0; // Assume innocent until proven guilty

  const { schema_failures, critic_rejections, total_uses } = modelStats;
  if (total_uses < 5) return 1.0; // Not enough statistical significance

  const failureRate = (schema_failures + critic_rejections) / total_uses;
  
  // Example threshold: If it fails 10% of the time, that's bad.
  // 0 failure rate -> score 1.0
  const score = Math.max(0, 1.0 - (failureRate * 5)); // Penalize heavily
  return Number(score.toFixed(2));
}

// Kick off periodic background sync
setInterval(() => {
  updateScorecards().catch(() => {});
}, 60000).unref();
