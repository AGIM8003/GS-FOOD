#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';

process.env.FREEAI_SWARM_PERSIST = '';

const ITERATIONS = parseInt(process.env.BENCHMARK_N || '20', 10);
const stubExec = async (ctx) => ({ output: `bench-out-${ctx.node.node_id}`, meta: {} });
const BASELINE_ID = String(process.env.BENCHMARK_BASELINE_ID || '').trim() || null;

function makeGraph(i) {
  return {
    graph_id: `bench-${i}`,
    graph_name: `Benchmark ${i}`,
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: { iteration: i },
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: `bench ${i}` } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: `bench ${i} branch` } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'p2' },
      { from_node_id: 'p2', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

function currentGitHead() {
  const out = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: process.cwd(), encoding: 'utf8' });
  if (out.status !== 0) return null;
  return String(out.stdout || '').trim() || null;
}

function persistBenchmarkReport(report) {
  const reportsDir = path.join(process.cwd(), 'evidence', 'reports', 'benchmark');
  fs.mkdirSync(reportsDir, { recursive: true });
  const fileName = `benchmark-swarm-${Date.now()}.json`;
  const filePath = path.join(reportsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  const indexPath = path.join(reportsDir, 'index.jsonl');
  fs.appendFileSync(indexPath, JSON.stringify({
    generated_at: report.generated_at,
    schema_version: report.schema_version,
    report_file: fileName,
    verdict: report.verdict,
    baseline_id: report.baseline_id,
    iterations: report.benchmark.iterations,
    throughput_runs_per_sec: report.benchmark.throughput_runs_per_sec,
    p95_latency_ms: report.benchmark.latency_ms.p95,
    success_rate_percent: report.benchmark.success_rate_percent,
    git_head: report.provenance.git_head,
    node_version: report.provenance.node_version,
  }) + '\n');
  return { filePath, indexPath };
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

const t0 = Date.now();
let successes = 0;
let failures = 0;
let totalReceipts = 0;
const latencies = [];

for (let i = 0; i < ITERATIONS; i++) {
  const it0 = Date.now();
  const result = await runSwarmGraph(makeGraph(i), { executePromptNode: stubExec });
  const dur = Date.now() - it0;
  latencies.push(dur);
  if (result.ok) {
    successes += 1;
    const run = getRun(result.run_id);
    totalReceipts += (run?.receipts || []).length;
  } else {
    failures += 1;
  }
}

const totalMs = Date.now() - t0;
latencies.sort((a, b) => a - b);
const p50 = latencies[Math.floor(latencies.length * 0.5)];
const p95 = latencies[Math.floor(latencies.length * 0.95)];
const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
const successRatePercent = Number(((successes / ITERATIONS) * 100).toFixed(2));
const throughputRunsPerSec = Number(((ITERATIONS / totalMs) * 1000).toFixed(2));

const report = {
  schema_version: 'freeaiSwarmBenchmarkReport.v1',
  phase: 'freeai_swarm_benchmark',
  generated_at: new Date().toISOString(),
  verdict: failures === 0 ? 'PASS' : 'FAIL',
  baseline_id: BASELINE_ID,
  provenance: {
    git_head: currentGitHead(),
    node_version: process.version,
    ci_run_id: String(process.env.GITHUB_RUN_ID || '').trim() || null,
  },
  benchmark: {
    iterations: ITERATIONS,
    successes,
    failures,
    success_rate_percent: successRatePercent,
    total_receipts: totalReceipts,
    avg_receipts_per_run: Number((totalReceipts / Math.max(1, successes)).toFixed(2)),
    total_ms: totalMs,
    latency_ms: { avg, p50, p95 },
    throughput_runs_per_sec: throughputRunsPerSec,
  },
};
const persisted = persistBenchmarkReport(report);

console.log('=== SWARM BENCHMARK ===');
console.log(`iterations: ${ITERATIONS}`);
console.log(`successes: ${successes}`);
console.log(`failures: ${failures}`);
console.log(`success_rate: ${successRatePercent.toFixed(1)}%`);
console.log(`total_receipts: ${totalReceipts}`);
console.log(`avg_receipts_per_run: ${(totalReceipts / Math.max(1, successes)).toFixed(1)}`);
console.log(`total_ms: ${totalMs}`);
console.log(`avg_latency_ms: ${avg}`);
console.log(`p50_latency_ms: ${p50}`);
console.log(`p95_latency_ms: ${p95}`);
console.log(`throughput_runs_per_sec: ${throughputRunsPerSec.toFixed(1)}`);
console.log(`benchmark_report_path: ${persisted.filePath}`);
console.log(`benchmark_index_path: ${persisted.indexPath}`);

if (failures > 0) {
  console.error(`BENCHMARK: ${failures} failures detected`);
  process.exit(1);
}

console.log('BENCHMARK: PASS');

__resetSwarmStoreForTests();
