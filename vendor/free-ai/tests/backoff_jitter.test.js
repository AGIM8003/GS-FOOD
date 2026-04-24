import assert from 'assert';
import { backoffWithJitterMs } from '../src/util/backoffWithJitter.js';
import { suggestedHedgeSpacingMs } from '../src/providers/hedging.js';

for (let i = 0; i < 20; i++) {
  const v = backoffWithJitterMs(i, 100, 10_000);
  assert.ok(v >= 0 && v < 10_001, `iter ${i} value ${v}`);
}

// Negative / NaN attemptIndex floors to 0
const vNeg = backoffWithJitterMs(-3, 50, 5000);
assert.ok(vNeg >= 0 && vNeg < 51);
const vNaN = backoffWithJitterMs(Number.NaN, 50, 5000);
assert.ok(vNaN >= 0 && vNaN < 51);

// Large attemptIndex hits cap
for (let k = 0; k < 15; k++) {
  const hi = backoffWithJitterMs(40, 100, 8000);
  assert.ok(hi >= 0 && hi < 8001, `capped hi ${hi}`);
}

const h = suggestedHedgeSpacingMs(2, { hedge_enabled: false, hedge_initial_delay_ms: 100 });
assert.ok(h >= 0 && h < 15_001, `hedge spacing ${h}`);

for (let j = 0; j < 10; j++) {
  const low = suggestedHedgeSpacingMs(0, { hedge_enabled: false, hedge_initial_delay_ms: 50 });
  assert.ok(low >= 0 && low < 15_001);
}

console.log('backoff_jitter test OK');
