import assert from 'assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { emitMetric, getMetricsJsonlPath } from '../src/observability/metrics.js';

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'freeai-metrics-env-'));
const tmpFile = path.join(tmp, 'custom-metrics.jsonl');
const prev = process.env.FREEAI_METRICS_JSONL;
process.env.FREEAI_METRICS_JSONL = tmpFile;

assert.strictEqual(getMetricsJsonlPath(), tmpFile);

await emitMetric({ event: 'metrics_env_test', trace_id: 't-env-1' });
const raw = await fs.readFile(tmpFile, 'utf8');
const row = JSON.parse(raw.trim().split('\n').pop());
assert.strictEqual(row.event, 'metrics_env_test');

if (prev === undefined) delete process.env.FREEAI_METRICS_JSONL;
else process.env.FREEAI_METRICS_JSONL = prev;

console.log('metrics_jsonl_env test OK');
