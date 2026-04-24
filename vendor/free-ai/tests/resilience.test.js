import assert from 'assert';
import {
  ERROR_CLASSES,
  classifyError,
  isRetryable,
  computeDelay,
  cbCanAttempt,
  cbRecordSuccess,
  cbRecordFailure,
  getCircuitBreakerState,
  listCircuitBreakers,
  executeWithResilience,
  __resetResilienceForTests,
} from '../src/swarm/resilience.js';

function suite(name, fn) { console.log(`  suite: ${name}`); fn(); }
function test(name, fn) {
  try { fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

async function testAsync(name, fn) {
  try { await fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

console.log('resilience.test.js');

suite('Error Taxonomy', () => {
  __resetResilienceForTests();

  test('classifies rate limit errors', () => {
    assert.strictEqual(classifyError(new Error('429 rate limit exceeded')), ERROR_CLASSES.RATE_LIMITED);
    assert.strictEqual(classifyError(new Error('throttled by provider')), ERROR_CLASSES.RATE_LIMITED);
  });

  test('classifies transient errors', () => {
    assert.strictEqual(classifyError(new Error('ECONNREFUSED')), ERROR_CLASSES.TRANSIENT);
    assert.strictEqual(classifyError(new Error('timeout waiting')), ERROR_CLASSES.TRANSIENT);
    assert.strictEqual(classifyError(new Error('503 service unavailable')), ERROR_CLASSES.TRANSIENT);
  });

  test('classifies permanent errors', () => {
    assert.strictEqual(classifyError(new Error('401 unauthorized')), ERROR_CLASSES.PERMANENT);
    assert.strictEqual(classifyError(new Error('permission denied')), ERROR_CLASSES.PERMANENT);
    assert.strictEqual(classifyError(new Error('tool_not_found')), ERROR_CLASSES.PERMANENT);
  });

  test('isRetryable returns true for transient and rate_limited', () => {
    assert.strictEqual(isRetryable(ERROR_CLASSES.TRANSIENT), true);
    assert.strictEqual(isRetryable(ERROR_CLASSES.RATE_LIMITED), true);
    assert.strictEqual(isRetryable(ERROR_CLASSES.PERMANENT), false);
    assert.strictEqual(isRetryable(ERROR_CLASSES.BUDGET_EXHAUSTED), false);
  });
});

suite('Exponential Backoff with Jitter', () => {
  test('delay increases exponentially', () => {
    const d0 = computeDelay(0, { base_delay_ms: 100, max_delay_ms: 10000, jitter: false });
    const d1 = computeDelay(1, { base_delay_ms: 100, max_delay_ms: 10000, jitter: false });
    const d2 = computeDelay(2, { base_delay_ms: 100, max_delay_ms: 10000, jitter: false });
    assert.strictEqual(d0, 100);
    assert.strictEqual(d1, 200);
    assert.strictEqual(d2, 400);
  });

  test('delay caps at max_delay_ms', () => {
    const d = computeDelay(20, { base_delay_ms: 100, max_delay_ms: 5000, jitter: false });
    assert.strictEqual(d, 5000);
  });

  test('jitter varies the delay', () => {
    const delays = new Set();
    for (let i = 0; i < 10; i++) {
      delays.add(computeDelay(2, { base_delay_ms: 100, max_delay_ms: 10000, jitter: true }));
    }
    assert.ok(delays.size > 1, 'jitter should produce varied delays');
  });
});

suite('Circuit Breaker', () => {
  __resetResilienceForTests();

  test('starts closed and allows attempts', () => {
    assert.strictEqual(cbCanAttempt('svc-a'), true);
    assert.strictEqual(getCircuitBreakerState('svc-a').state, 'closed');
  });

  test('opens after failure threshold', () => {
    for (let i = 0; i < 5; i++) cbRecordFailure('svc-b');
    assert.strictEqual(getCircuitBreakerState('svc-b').state, 'open');
    assert.strictEqual(cbCanAttempt('svc-b'), false);
  });

  test('resets to closed on success', () => {
    cbRecordSuccess('svc-b');
    assert.strictEqual(getCircuitBreakerState('svc-b').state, 'closed');
    assert.strictEqual(cbCanAttempt('svc-b'), true);
  });

  test('listCircuitBreakers returns all breakers', () => {
    const list = listCircuitBreakers();
    assert.ok(list.length >= 2);
    assert.ok(list.some((b) => b.service === 'svc-a'));
    assert.ok(list.some((b) => b.service === 'svc-b'));
  });
});

suite('executeWithResilience', async () => {
  __resetResilienceForTests();

  await testAsync('succeeds on first attempt', async () => {
    const result = await executeWithResilience(() => Promise.resolve('ok'), { run_id: 'r1' });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result, 'ok');
    assert.strictEqual(result.attempts, 1);
  });

  await testAsync('retries on transient errors then succeeds', async () => {
    let attempt = 0;
    const result = await executeWithResilience(() => {
      attempt++;
      if (attempt < 3) throw new Error('timeout waiting');
      return Promise.resolve('recovered');
    }, { run_id: 'r2', retry_config: { max_retries: 3, base_delay_ms: 10, jitter: false } });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.result, 'recovered');
    assert.strictEqual(result.attempts, 3);
  });

  await testAsync('fails immediately on permanent errors', async () => {
    const result = await executeWithResilience(
      () => { throw new Error('permission denied'); },
      { run_id: 'r3', retry_config: { max_retries: 3, base_delay_ms: 10, jitter: false } },
    );
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.attempts, 1);
    assert.strictEqual(result.error_class, ERROR_CLASSES.PERMANENT);
  });

  await testAsync('respects retry budget', async () => {
    const result = await executeWithResilience(
      () => { throw new Error('timeout'); },
      { run_id: 'r-budget', retry_config: { max_retries: 20, base_delay_ms: 1, jitter: false, retry_budget: 3 } },
    );
    assert.strictEqual(result.ok, false);
    assert.ok(result.attempts <= 4);
  });
});

console.log('resilience.test.js: all passed');
