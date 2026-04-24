import assert from 'assert';
import { mergedTimeoutAndOptionalParent } from '../src/util/abortSignals.js';
import { determineCostTier } from '../scripts/annotate_provider_cost_tiers.js';
import { userHintForFailureChainLink, isRateLimitLikeError } from '../src/providers/userFacingErrors.js';

const ac = new AbortController();
const { signal, dispose } = mergedTimeoutAndOptionalParent(60_000, ac.signal);
assert.strictEqual(signal.aborted, false);
ac.abort();
assert.strictEqual(signal.aborted, true);
dispose();

assert.strictEqual(determineCostTier(0, 0), 'free');
assert.strictEqual(determineCostTier(0.5, 1), 'cheap');
assert.strictEqual(determineCostTier(5, 10), 'balanced');
assert.strictEqual(determineCostTier(100, 100), 'premium');

const hint = userHintForFailureChainLink({ error_class: 'rate_limited', raw: '' }, null);
assert.ok(hint && hint.includes('Rate limit'));

assert.strictEqual(isRateLimitLikeError(new Error('HTTP 429')), true);

console.log('donor_patterns test OK');
