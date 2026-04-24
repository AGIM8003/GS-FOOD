/**
 * Rolling latency samples per route key (provider_id:infer).
 * Used for §2.12-style adaptive deadlines; does not override §2.4 HTTP cooldowns.
 */

const MAX_SAMPLES = 64;
const rings = new Map();

function ringFor(key) {
  if (!rings.has(key)) rings.set(key, []);
  return rings.get(key);
}

export function recordRouteLatency(key, latencyMs) {
  if (!key || typeof latencyMs !== 'number' || latencyMs < 0) return;
  const ring = ringFor(key);
  ring.push(latencyMs);
  if (ring.length > MAX_SAMPLES) ring.shift();
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

/**
 * Returns timeout ms: clamp( p95 * multiplier, floorMs, capMs ), or fallbackMs if no data.
 */
export function getAdaptiveTimeoutMs(key, fallbackMs, opts = {}) {
  const use = process.env.ADAPTIVE_TIMEOUT === '1';
  if (!use) return fallbackMs;
  const floorMs = opts.floorMs ?? 2000;
  const capMs = opts.capMs ?? Math.min(120000, fallbackMs * 2);
  const mult = opts.multiplier ?? 1.5;
  const ring = ringFor(key);
  if (ring.length < 3) return fallbackMs;
  const sorted = [...ring].sort((a, b) => a - b);
  const p95 = percentile(sorted, 0.95) ?? fallbackMs;
  const raw = Math.round(p95 * mult);
  return Math.min(capMs, Math.max(floorMs, raw));
}
