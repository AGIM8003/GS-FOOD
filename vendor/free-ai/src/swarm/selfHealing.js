/**
 * Self-Healing Workflows & MGV Pre-Flight.
 *
 * Auto-reroutes around persistently failing nodes by selecting alternative
 * paths. Implements Machine-Generated Verification pre-flight checks.
 */

const healingLog = [];
const preflightChecks = new Map();

function registerPreflightCheck(name, checkFn) {
  if (typeof checkFn !== 'function') throw new Error('check must be a function');
  preflightChecks.set(name, checkFn);
}

async function runPreflight(graphBody) {
  const results = [];
  for (const [name, fn] of preflightChecks) {
    try {
      const result = await fn(graphBody);
      results.push({ check: name, passed: result.passed !== false, details: result.details || null });
    } catch (err) {
      results.push({ check: name, passed: false, details: err?.message || String(err) });
    }
  }
  const allPassed = results.every((r) => r.passed);
  return { ok: allPassed, checks: results, total: results.length, passed: results.filter((r) => r.passed).length };
}

function suggestHealingAction(nodeId, failureHistory) {
  if (!Array.isArray(failureHistory) || failureHistory.length === 0) {
    return { action: 'none', reason: 'no_failure_history' };
  }

  const recentFailures = failureHistory.filter(
    (f) => Date.now() - (f.timestamp || 0) < 300000,
  );

  if (recentFailures.length >= 3) {
    const action = { action: 'skip_node', reason: 'persistent_failure', failure_count: recentFailures.length, node_id: nodeId };
    healingLog.push({ ...action, at: new Date().toISOString() });
    return action;
  }

  if (recentFailures.length >= 1) {
    const action = { action: 'retry_with_fallback', reason: 'intermittent_failure', failure_count: recentFailures.length, node_id: nodeId };
    healingLog.push({ ...action, at: new Date().toISOString() });
    return action;
  }

  return { action: 'none', reason: 'no_recent_failures' };
}

function getHealingLog() {
  return healingLog.slice();
}

function __resetSelfHealingForTests() {
  healingLog.length = 0;
  preflightChecks.clear();
}

export { registerPreflightCheck, runPreflight, suggestHealingAction, getHealingLog, __resetSelfHealingForTests };
