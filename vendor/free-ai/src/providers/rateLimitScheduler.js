/*
 * Predictive Rate-Limit Token Scheduler
 * Tracks rate limit TTLs across providers and models to proactively demote them
 * during routing, avoiding "cold-start" 429 timeouts on free tiers.
 */

const rateLimitCache = new Map();

/**
 * Update the rate limit cache dynamically based on response headers.
 * @param {string} providerId - The ID of the provider (e.g. 'groq', 'gemini')
 * @param {Object} limits - Limit properties usually extracted from headers
 */
export function trackRateLimit(providerId, { remainingRequests, resetRequestsMs }) {
  if (remainingRequests === undefined || resetRequestsMs === undefined) return;

  const resetAt = Date.now() + resetRequestsMs;
  
  rateLimitCache.set(providerId, {
    remainingRequests,
    resetAt
  });
}

/**
 * Checks if a provider has capacity to serve a request.
 * If true, it is available. If false, it has hit a predictive rate limit window.
 * 
 * @param {string} providerId 
 * @returns {boolean}
 */
export function canRequest(providerId) {
  const cached = rateLimitCache.get(providerId);
  if (!cached) return true; // No data, assume healthy

  const now = Date.now();
  if (now > cached.resetAt) {
    // TTL passed, assume reset
    rateLimitCache.delete(providerId);
    return true;
  }

  // If we are within the TTL and we know we have 0 remaining requests, preemptively fail.
  if (cached.remainingRequests <= 0) {
    return false;
  }

  return true;
}

/**
 * Helper to extract remaining limits from common Provider headers
 */
export function extractLimitsFromHeaders(headers) {
  const remainingReq = parseInt(headers.get('x-ratelimit-remaining-requests') || headers.get('x-ratelimit-remaining') || '-1', 10);
  let resetReqMs = -1;
  
  // Various resets (often in seconds or direct ms, sometimes Unix timestamp)
  const resetStr = headers.get('x-ratelimit-reset-requests') || headers.get('x-ratelimit-reset') || '-1';
  
  if (resetStr !== '-1') {
    const rawReset = parseFloat(resetStr);
    // If it looks like a future unix timestamp (e.g., > 1.5 billion)
    if (rawReset > 1500000000) {
      const nowTs = Math.floor(Date.now() / 1000);
      resetReqMs = Math.max(0, rawReset - nowTs) * 1000;
    } else {
      // Typically in seconds or ms, fallback to assuming seconds
      // if it's less than standard ms conversions (like < 1000 seconds)
      const asSeconds = rawReset * (resetStr.includes('ms') ? 1 : 1000); // simplify
      resetReqMs = asSeconds;
    }
  }

  return { remainingRequests: remainingReq, resetRequestsMs: resetReqMs };
}
