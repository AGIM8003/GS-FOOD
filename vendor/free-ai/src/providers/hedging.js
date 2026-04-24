/**
 * §2.13 hedged requests — not yet wired into ProviderRegistry.callProviders.
 * Use HEDGE_ENABLED=1 only after adapters support cooperative cancellation (AbortSignal).
 */

import { backoffWithJitterMs } from '../util/backoffWithJitter.js';

export function isHedgeFeatureEnabled(cfg = {}) {
  if (cfg.hedge_enabled === true) return true;
  return process.env.HEDGE_ENABLED === '1';
}

export function readHedgePolicy(cfg = {}) {
  return {
    enabled: isHedgeFeatureEnabled(cfg),
    initialDelayMs: Number(process.env.HEDGE_DELAY_MS) || cfg.hedge_initial_delay_ms || 200,
    perTenantBudgetPerDay: Number(process.env.HEDGE_DAILY_BUDGET) || cfg.hedge_daily_budget || 100,
  };
}

/**
 * Suggested delay (milliseconds) before a secondary hedge attempt for the same logical request.
 * Delegates to backoffWithJitterMs with initialDelayMs from readHedgePolicy and a 15_000 ms cap.
 * Inputs: attemptIndex (same contract as backoffWithJitterMs); cfg overrides hedge_initial_delay_ms when passed.
 * Output: integer ms in [0, min(15000, initialDelayMs * 2^n)).
 */
export function suggestedHedgeSpacingMs(attemptIndex, cfg = {}) {
  const p = readHedgePolicy(cfg);
  return backoffWithJitterMs(attemptIndex, p.initialDelayMs, 15_000);
}
