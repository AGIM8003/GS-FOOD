/**
 * Token & Cost Budget Governor.
 *
 * Hard-caps total tokens and cost per swarm run with graceful degradation.
 * Tracks consumption per node and enforces limits before execution.
 */

const runBudgets = new Map();

const DEFAULT_BUDGET = {
  max_tokens: 100000,
  max_cost: 1.0,
  warn_at_percent: 80,
  degrade_at_percent: 90,
};

function initBudget(runId, config) {
  const budget = { ...DEFAULT_BUDGET, ...config };
  runBudgets.set(runId, {
    run_id: runId,
    max_tokens: budget.max_tokens,
    max_cost: budget.max_cost,
    warn_at_percent: budget.warn_at_percent,
    degrade_at_percent: budget.degrade_at_percent,
    consumed_tokens: 0,
    consumed_cost: 0,
    status: 'active',
    degraded: false,
    nodes_executed: 0,
  });
  return runBudgets.get(runId);
}

function getBudget(runId) {
  return runBudgets.get(runId) || null;
}

function checkBudget(runId, estimatedTokens, estimatedCost) {
  const b = runBudgets.get(runId);
  if (!b) return { allowed: true, reason: 'no_budget_set' };

  const projectedTokens = b.consumed_tokens + (estimatedTokens || 0);
  const projectedCost = b.consumed_cost + (estimatedCost || 0);
  const tokenPercent = (projectedTokens / b.max_tokens) * 100;
  const costPercent = (projectedCost / b.max_cost) * 100;
  const percent = Math.max(tokenPercent, costPercent);

  if (projectedTokens > b.max_tokens) {
    b.status = 'exhausted';
    return { allowed: false, reason: 'token_budget_exhausted', percent: Math.round(tokenPercent) };
  }
  if (projectedCost > b.max_cost) {
    b.status = 'exhausted';
    return { allowed: false, reason: 'cost_budget_exhausted', percent: Math.round(costPercent) };
  }
  if (percent >= b.degrade_at_percent) {
    b.degraded = true;
    return { allowed: true, degraded: true, reason: 'budget_degraded', percent: Math.round(percent) };
  }
  if (percent >= b.warn_at_percent) {
    return { allowed: true, warning: true, reason: 'budget_warning', percent: Math.round(percent) };
  }
  return { allowed: true, percent: Math.round(percent) };
}

function consumeBudget(runId, tokens, cost) {
  const b = runBudgets.get(runId);
  if (!b) return;
  b.consumed_tokens += (tokens || 0);
  b.consumed_cost += (cost || 0);
  b.nodes_executed++;
}

function clearBudget(runId) {
  runBudgets.delete(runId);
}

function __resetBudgetsForTests() {
  runBudgets.clear();
}

export { initBudget, getBudget, checkBudget, consumeBudget, clearBudget, DEFAULT_BUDGET, __resetBudgetsForTests };
