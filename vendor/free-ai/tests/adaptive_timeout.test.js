import assert from 'assert';
import { recordRouteLatency, getAdaptiveTimeoutMs } from '../src/observability/adaptiveTimeout.js';

const prev = process.env.ADAPTIVE_TIMEOUT;
process.env.ADAPTIVE_TIMEOUT = '1';
recordRouteLatency('gemini:infer', 100);
recordRouteLatency('gemini:infer', 120);
recordRouteLatency('gemini:infer', 110);
recordRouteLatency('gemini:infer', 105);
recordRouteLatency('gemini:infer', 115);
const t = getAdaptiveTimeoutMs('gemini:infer', 15000);
assert.ok(t >= 2000 && t <= 15000 * 2, `expected clamped adaptive timeout, got ${t}`);
process.env.ADAPTIVE_TIMEOUT = prev;
console.log('adaptive_timeout.test ok');
