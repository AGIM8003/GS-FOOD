import assert from 'assert';
import { normalizeUsageForReceipt } from '../src/observability/usageAccounting.js';

const z = normalizeUsageForReceipt(null);
assert.strictEqual(z.prompt_tokens, 0);
assert.strictEqual(z.completion_tokens, 0);
assert.strictEqual(z.total_tokens, 0);
assert.strictEqual(z.provider_reported, false);

const oai = normalizeUsageForReceipt({ prompt_tokens: 3, completion_tokens: 7, total_tokens: 10 });
assert.strictEqual(oai.prompt_tokens, 3);
assert.strictEqual(oai.completion_tokens, 7);
assert.strictEqual(oai.total_tokens, 10);
assert.strictEqual(oai.provider_reported, true);

const partial = normalizeUsageForReceipt({ prompt_tokens: 2, completion_tokens: 4 });
assert.strictEqual(partial.total_tokens, 6);

const alt = normalizeUsageForReceipt({ input_tokens: 1, output_tokens: 2, total_tokens: 0 });
assert.strictEqual(alt.prompt_tokens, 1);
assert.strictEqual(alt.completion_tokens, 2);
assert.strictEqual(alt.total_tokens, 3);

console.log('usage_accounting test OK');
