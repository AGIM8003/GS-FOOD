/**
 * Exponential backoff with full jitter (§2.16 — shared helper for retries / spacing).
 *
 * Contract:
 * - attemptIndex: number; negative or non-finite values are treated as 0 (first attempt spacing).
 * - baseMs: positive number; default 200. Used as the seed for 2^n growth before cap.
 * - maxMs: positive number; hard ceiling on the exponential cap before jitter draws.
 * - Return: integer milliseconds in [0, cap) where cap = min(maxMs, baseMs * 2^n), n = max(0, floor(attemptIndex)).
 * - Randomness: uniform integer in [0, cap); when cap is 1, result is always 0.
 * - Determinism: not deterministic across calls (uses Math.random); tests assert bounds only.
 */
export function backoffWithJitterMs(attemptIndex, baseMs = 200, maxMs = 30_000) {
  const rawN = Number(attemptIndex);
  const n = Number.isFinite(rawN) ? Math.max(0, Math.floor(rawN)) : 0;
  const base = Math.max(1, Number(baseMs) || 200);
  const capMax = Math.max(1, Number(maxMs) || 30_000);
  const cap = Math.min(capMax, base * 2 ** n);
  return Math.floor(Math.random() * Math.max(1, cap));
}
