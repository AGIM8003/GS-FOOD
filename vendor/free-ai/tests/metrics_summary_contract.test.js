import assert from 'assert';
import { summarizeMetricsWindow } from '../src/observability/metrics.js';
import { getMetricsSummary } from '../src/server/admin.js';

const empty = summarizeMetricsWindow([]);
assert.strictEqual(empty.window_rows, 0);
assert.ok(typeof empty.by_event === 'object');
assert.ok(typeof empty.by_provider === 'object');
assert.ok('request_handled' in empty);
assert.ok('gen_ai_stream' in empty);
assert.ok('gen_ai_infer' in empty);
assert.strictEqual(empty.latency_ms_p95_sample, null);

const sample = summarizeMetricsWindow([
  { event: 'gen_ai_infer', provider_id: 'openrouter', gen_ai_latency_ms: 100 },
  { event: 'gen_ai_infer', provider_id: 'openrouter', gen_ai_latency_ms: 200 },
  { event: 'request_handled', status: 200 },
  { event: 'gen_ai_stream', provider_id: 'ollama', client_cancelled: true },
]);
assert.strictEqual(sample.window_rows, 4);
assert.strictEqual(sample.gen_ai_infer.total, 2);
assert.ok(sample.by_provider.openrouter >= 1);
assert.ok(sample.by_provider.ollama >= 1);

const admin = await getMetricsSummary();
const requiredTop = [
  'window_rows',
  'by_event',
  'by_provider',
  'request_handled',
  'gen_ai_stream',
  'gen_ai_infer',
  'latency_ms_p95_sample',
  'generated_at',
  'spec_notes',
];
for (const k of requiredTop) {
  assert.ok(k in admin, `getMetricsSummary() missing key: ${k}`);
}
assert.ok(typeof admin.generated_at === 'string');
assert.ok(admin.spec_notes && admin.spec_notes.includes('§33.6'));
assert.ok(typeof admin.request_handled?.total === 'number');
assert.ok(typeof admin.request_handled?.errors_or_4xx === 'number');
assert.ok(typeof admin.gen_ai_stream?.total === 'number');
assert.ok(typeof admin.gen_ai_stream?.client_cancelled === 'number');
assert.ok(typeof admin.gen_ai_infer?.total === 'number');

console.log('metrics_summary_contract test OK');
