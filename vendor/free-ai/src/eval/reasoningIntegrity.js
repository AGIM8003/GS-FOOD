/*
 * Reasoning Integrity Heuristic (RIS)
 * Tracks qualitative reasoning integrity for free-tier providers to auto-demote
 * "flaky" nodes that return soft-failures (e.g. prompt echoing, extremely short answers for complex queries).
 */

import { setCooldown } from '../providers/cooldownManager.js';

export const FLAKINESS_SCORE_THRESHOLD = 0.6;
const providerRisLogs = new Map();

/**
 * Calculates a basic RIS score based on the output payload.
 * 
 * @param {string} prompt - The user prompt (or combined turn text)
 * @param {string} response - The LLM's generated response
 * @param {string} finishReason - Provider reported finish reason (if available)
 * @returns {number} Score between 0.0 (Worst) and 1.0 (Best)
 */
export function calculateRIS(prompt, response, finishReason) {
  let score = 1.0;

  // Extremely short responses for non-trivial prompts usually mean the provider flaked
  if (prompt && prompt.length > 50 && response.length < 10) {
    score -= 0.5;
  }

  // Provider reported length cutoff heavily penalizes reasoning
  if (finishReason === 'length') {
    score -= 0.3;
  }

  // Exact repetition of the prompt usually indicates a system failure
  if (prompt && response && prompt.trim() === response.trim()) {
    score -= 0.8; 
  }

  // Empty responses are outright failures
  if (!response || response.trim().length === 0) {
    score = 0.0;
  }

  return Math.max(0.0, score);
}

/**
 * Logs the reasoning integrity check for a given provider.
 * If the rolling average dips below the threshold, automatically applies a cooldown.
 * 
 * @param {string} providerId 
 * @param {number} risScore 
 */
export function logIntegrityAndEnforce(providerId, risScore) {
  if (!providerRisLogs.has(providerId)) {
    providerRisLogs.set(providerId, []);
  }

  const logs = providerRisLogs.get(providerId);
  logs.push(risScore);

  // Keep rolling window of last 3 calls
  if (logs.length > 3) {
    logs.shift();
  }

  const rollingAvg = logs.reduce((a, b) => a + b, 0) / logs.length;

  if (logs.length >= 3 && rollingAvg < FLAKINESS_SCORE_THRESHOLD) {
    // Demote this provider for 15 minutes due to flakiness
    setCooldown(providerId, 900000, 'flaky_reasoning_integrity');
    // Clear logs to give it a fresh start after cooldown
    providerRisLogs.set(providerId, []);
  }

  return rollingAvg;
}
