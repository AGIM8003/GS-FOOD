/**
 * Retry / Resilience layer for swarm node execution.
 *
 * Provides: error taxonomy, exponential backoff with jitter,
 * per-service circuit breakers, and per-run retry budgets.
 */

const ERROR_CLASSES = {
  TRANSIENT: 'transient',
  RATE_LIMITED: 'rate_limited',
  PERMANENT: 'permanent',
  BUDGET_EXHAUSTED: 'budget_exhausted',
};

const DEFAULT_RETRY_CONFIG = {
  max_retries: 3,
  base_delay_ms: 200,
  max_delay_ms: 10000,
  jitter: true,
  retry_budget: 10,
};

function classifyError(err) {
  const msg = (err?.message || String(err)).toLowerCase();
  if (msg.includes('rate') || msg.includes('429') || msg.includes('throttl')) {
    return ERROR_CLASSES.RATE_LIMITED;
  }
  if (
    msg.includes('timeout') || msg.includes('econnrefused') ||
    msg.includes('econnreset') || msg.includes('503') || msg.includes('502') ||
    msg.includes('network') || msg.includes('unavailable') || msg.includes('etimedout')
  ) {
    return ERROR_CLASSES.TRANSIENT;
  }
  if (
    msg.includes('not_found') || msg.includes('permission') || msg.includes('401') ||
    msg.includes('403') || msg.includes('invalid') || msg.includes('schema') ||
    msg.includes('unsupported')
  ) {
    return ERROR_CLASSES.PERMANENT;
  }
  return ERROR_CLASSES.TRANSIENT;
}

function isRetryable(errorClass) {
  return errorClass === ERROR_CLASSES.TRANSIENT || errorClass === ERROR_CLASSES.RATE_LIMITED;
}

function computeDelay(attempt, config) {
  const base = config.base_delay_ms || 200;
  const max = config.max_delay_ms || 10000;
  const exponential = Math.min(base * Math.pow(2, attempt), max);
  if (!config.jitter) return exponential;
  return Math.floor(exponential * (0.5 + Math.random() * 0.5));
}

const circuitBreakers = new Map();

const CB_DEFAULTS = {
  failure_threshold: 5,
  reset_timeout_ms: 30000,
  half_open_max: 2,
};

function getCircuitBreaker(serviceKey) {
  if (!circuitBreakers.has(serviceKey)) {
    circuitBreakers.set(serviceKey, {
      state: 'closed',
      failure_count: 0,
      last_failure_at: 0,
      half_open_attempts: 0,
      config: { ...CB_DEFAULTS },
    });
  }
  return circuitBreakers.get(serviceKey);
}

function cbCanAttempt(serviceKey) {
  const cb = getCircuitBreaker(serviceKey);
  if (cb.state === 'closed') return true;
  if (cb.state === 'open') {
    if (Date.now() - cb.last_failure_at >= cb.config.reset_timeout_ms) {
      cb.state = 'half_open';
      cb.half_open_attempts = 0;
      return true;
    }
    return false;
  }
  return cb.half_open_attempts < cb.config.half_open_max;
}

function cbRecordSuccess(serviceKey) {
  const cb = getCircuitBreaker(serviceKey);
  cb.state = 'closed';
  cb.failure_count = 0;
  cb.half_open_attempts = 0;
}

function cbRecordFailure(serviceKey) {
  const cb = getCircuitBreaker(serviceKey);
  cb.failure_count++;
  cb.last_failure_at = Date.now();
  if (cb.state === 'half_open') {
    cb.state = 'open';
    return;
  }
  if (cb.failure_count >= cb.config.failure_threshold) {
    cb.state = 'open';
  }
}

function getCircuitBreakerState(serviceKey) {
  const cb = getCircuitBreaker(serviceKey);
  return { service: serviceKey, state: cb.state, failure_count: cb.failure_count };
}

function listCircuitBreakers() {
  const result = [];
  for (const [key, cb] of circuitBreakers) {
    result.push({ service: key, state: cb.state, failure_count: cb.failure_count });
  }
  return result;
}

const retryBudgets = new Map();

function getRetryBudget(runId, maxBudget) {
  if (!retryBudgets.has(runId)) {
    retryBudgets.set(runId, { used: 0, max: maxBudget || DEFAULT_RETRY_CONFIG.retry_budget });
  }
  return retryBudgets.get(runId);
}

function consumeRetryBudget(runId) {
  const budget = getRetryBudget(runId);
  if (budget.used >= budget.max) return false;
  budget.used++;
  return true;
}

function clearRetryBudget(runId) {
  retryBudgets.delete(runId);
}

/**
 * Execute a function with retry logic, circuit breaker, and budget enforcement.
 *
 * @param {Function} fn - async function to execute
 * @param {object} opts
 * @param {string} opts.run_id - run identifier for budget tracking
 * @param {string} [opts.service_key] - circuit breaker key (e.g. 'provider:openai')
 * @param {object} [opts.retry_config] - override DEFAULT_RETRY_CONFIG
 * @returns {Promise<{ ok: boolean, result?: any, error?: string, attempts: number, error_class?: string }>}
 */
async function executeWithResilience(fn, opts = {}) {
  const config = { ...DEFAULT_RETRY_CONFIG, ...opts.retry_config };
  const runId = opts.run_id || 'unknown';
  const serviceKey = opts.service_key || 'default';
  let lastError = null;
  let lastErrorClass = null;

  for (let attempt = 0; attempt <= config.max_retries; attempt++) {
    if (!cbCanAttempt(serviceKey)) {
      return {
        ok: false,
        error: `circuit_breaker_open: ${serviceKey}`,
        attempts: attempt,
        error_class: ERROR_CLASSES.PERMANENT,
      };
    }

    if (attempt > 0 && !consumeRetryBudget(runId)) {
      return {
        ok: false,
        error: `retry_budget_exhausted (used ${getRetryBudget(runId).used}/${getRetryBudget(runId).max})`,
        attempts: attempt,
        error_class: ERROR_CLASSES.BUDGET_EXHAUSTED,
      };
    }

    try {
      const result = await fn();
      cbRecordSuccess(serviceKey);
      return { ok: true, result, attempts: attempt + 1 };
    } catch (err) {
      lastError = err;
      lastErrorClass = classifyError(err);

      if (!isRetryable(lastErrorClass)) {
        cbRecordFailure(serviceKey);
        return {
          ok: false,
          error: err?.message || String(err),
          attempts: attempt + 1,
          error_class: lastErrorClass,
        };
      }

      cbRecordFailure(serviceKey);

      if (attempt < config.max_retries) {
        if (typeof opts.onRetry === 'function') {
          try { await opts.onRetry(attempt + 1, err); } catch { /* ignore callback errors */ }
        }
        const delay = computeDelay(attempt, config);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  return {
    ok: false,
    error: lastError?.message || String(lastError),
    attempts: config.max_retries + 1,
    error_class: lastErrorClass,
  };
}

function __resetResilienceForTests() {
  circuitBreakers.clear();
  retryBudgets.clear();
}

export {
  ERROR_CLASSES,
  DEFAULT_RETRY_CONFIG,
  classifyError,
  isRetryable,
  computeDelay,
  cbCanAttempt,
  cbRecordSuccess,
  cbRecordFailure,
  getCircuitBreakerState,
  listCircuitBreakers,
  getRetryBudget,
  consumeRetryBudget,
  clearRetryBudget,
  executeWithResilience,
  __resetResilienceForTests,
};
