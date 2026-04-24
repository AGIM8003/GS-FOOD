/**
 * Normalized adapter result contract (call / callStream metadata paths share error classes).
 * FREE AI SSOT for behavior remains FREEAI.md; this module enforces a minimal structural contract.
 */

/**
 * @param {unknown} out
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateAdapterCallResult(out) {
  const errors = [];
  if (out === null || typeof out !== 'object') {
    errors.push('not_object');
    return { valid: false, errors };
  }
  if (out.ok === true) {
    if (typeof out.text !== 'string') errors.push('success_missing_text');
  } else if (out.ok === false) {
    if (out.error_class == null || String(out.error_class).length === 0) errors.push('failure_missing_error_class');
  } else {
    errors.push('missing_or_invalid_ok');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * First-class free-tier signal for routing (explicit `free_tier_eligible` or tier heuristic).
 * @param {Record<string, unknown>} p
 */
export function inferFreeTierEligible(p) {
  if (typeof p.free_tier_eligible === 'boolean') return p.free_tier_eligible;
  const tier = String(p.tier || '').toLowerCase();
  if (tier === 'paid') return false;
  if (tier === 'free-focused' || tier === 'free-capable' || tier === 'local' || tier === 'burst') return true;
  if (p.id === 'ollama') return true;
  return true;
}
