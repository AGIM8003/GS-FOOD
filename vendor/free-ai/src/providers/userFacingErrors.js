/**
 * Operator- and user-facing hints for common provider failures (HTTP class → short guidance).
 * Does not replace §2.4 cooldown semantics — supplements receipts and logs.
 */

export function isRateLimitLikeMessage(message) {
  const msg = String(message || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('ratelimit') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('too many requests')
  );
}

export function isRateLimitLikeError(errOrMessage) {
  if (!errOrMessage) return false;
  if (typeof errOrMessage === 'string') return isRateLimitLikeMessage(errOrMessage);
  if (errOrMessage.message) return isRateLimitLikeMessage(errOrMessage.message);
  return false;
}

/**
 * @param {{ error?: string, raw?: string, error_class?: string } | null} link
 * @param {number|null} httpStatus
 */
export function userHintForFailureChainLink(link, httpStatus = null) {
  if (!link) return null;
  const ec = link.error_class || link.error;
  const raw = link.raw || '';
  if (ec === 'rate_limited' || ec === 'quota_exhausted' || httpStatus === 429 || isRateLimitLikeMessage(raw)) {
    return 'Rate limit or quota reached. Wait briefly or switch provider; see §2.4 cooldowns.';
  }
  if (ec === 'auth_error' || httpStatus === 401 || httpStatus === 403) {
    return 'Authentication failed. Check API keys and provider policy.';
  }
  if (ec === 'model_not_found' || httpStatus === 404) {
    return 'Model not found. Update pins in providers.json or allowlist (§2.5 / §33).';
  }
  if (ec === 'timeout' || ec === 'upstream_error') {
    return 'Provider timeout or upstream error. Fallback may apply; check health matrix.';
  }
  if (ec === 'unknown_error' && String(raw).toLowerCase().includes('abort')) {
    return 'Request was cancelled or timed out.';
  }
  return null;
}

export function userHintFromReceiptContext({ failure_chain, http_status } = {}) {
  if (!Array.isArray(failure_chain) || failure_chain.length === 0) return null;
  return userHintForFailureChainLink(failure_chain[0], http_status);
}
