#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';
import { __resetSwarmStoreForTests } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { emitMetric } from '../src/observability/metrics.js';

process.env.FREEAI_SWARM_PERSIST = '';

const CONCURRENCY = Math.max(1, parseInt(process.env.SOAK_CONCURRENCY || '8', 10));
const DURATION_S = Math.max(5, parseInt(process.env.SOAK_DURATION_S || '20', 10));
const WORKERS = Math.max(1, parseInt(process.env.SOAK_WORKERS || '2', 10));
const BASELINE_ID = String(process.env.SOAK_BASELINE_ID || '').trim() || null;

const powerProbe = {
  startCpu: process.cpuUsage(),
  startHr: process.hrtime.bigint(),
  startMem: process.memoryUsage(),
};

function readPowerProbeEnd() {
  const endCpu = process.cpuUsage();
  const endHr = process.hrtime.bigint();
  const endMem = process.memoryUsage();
  const wallNs = Number(endHr - powerProbe.startHr);
  const cpuUserUs = endCpu.user - powerProbe.startCpu.user;
  const cpuSysUs = endCpu.system - powerProbe.startCpu.system;
  const cpuTotalUs = cpuUserUs + cpuSysUs;
  const cpuUtilApprox = wallNs > 0 ? (cpuTotalUs / (wallNs / 1000)) * 100 : 0;
  return {
    cpu_user_us: cpuUserUs,
    cpu_system_us: cpuSysUs,
    cpu_total_us: cpuTotalUs,
    wall_ms: Math.round(wallNs / 1e6),
    cpu_util_approx_percent: Number(cpuUtilApprox.toFixed(2)),
    rss_delta_mb: Number(((endMem.rss - powerProbe.startMem.rss) / (1024 * 1024)).toFixed(2)),
    heap_used_delta_mb: Number(((endMem.heapUsed - powerProbe.startMem.heapUsed) / (1024 * 1024)).toFixed(2)),
  };
}

function makeGraph(i) {
  return {
    graph_id: `soak-${i}`,
    graph_name: `Soak ${i}`,
    entry_node_id: 'p1',
    receipt_mode: 'none',
    input_payload: { i },
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: `soak ${i}` } },
      { node_id: 'p2', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: `branch ${i}` } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'f', task_lane: 'l', config: {} },
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

function persistSoakReport(report) {
  const reportsDir = path.join(process.cwd(), 'evidence', 'reports', 'soak');
  fs.mkdirSync(reportsDir, { recursive: true });
  const fileName = `soak-energy-${Date.now()}.json`;
  const filePath = path.join(reportsDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));

  const indexPath = path.join(reportsDir, 'index.jsonl');
  const indexRow = {
    generated_at: report.generated_at,
    schema_version: report.schema_version,
    report_file: fileName,
    verdict: report.verdict,
    baseline_id: report.baseline_id,
    throughput_runs_per_sec: report.soak.throughput_runs_per_sec,
    p95_latency_ms: report.soak.latency_ms.p95,
    success_rate_percent: report.soak.success_rate_percent,
    cpu_util_approx_percent: report.power_energy_proxy.cpu_util_approx_percent,
    rss_delta_mb: report.power_energy_proxy.rss_delta_mb,
    git_head: report.provenance.git_head,
    node_version: report.provenance.node_version,
  };
  fs.appendFileSync(indexPath, JSON.stringify(indexRow) + '\n');
  return { filePath, indexPath };
}

async function execPrompt(ctx) {
  const payload = `${ctx.node.node_id}:${Date.now()}`;
  return { output: payload, meta: { worker: WORKERS } };
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

const t0 = Date.now();
const deadline = t0 + (DURATION_S * 1000);
let submitted = 0;
let ok = 0;
let failed = 0;
const latencies = [];

async function runLoop(workerId) {
  while (Date.now() < deadline) {
    const id = `${workerId}-${submitted}`;
    submitted += 1;
    const runStart = Date.now();
    const result = await runSwarmGraph(makeGraph(id), { executePromptNode: execPrompt });
    latencies.push(Date.now() - runStart);
    if (result.ok) ok += 1;
    else failed += 1;
  }
}

const loops = [];
for (let i = 0; i < CONCURRENCY; i += 1) {
  loops.push(runLoop(i));
}
await Promise.all(loops);

const telemetry = readPowerProbeEnd();
latencies.sort((a, b) => a - b);
const p50 = latencies.length ? latencies[Math.floor(latencies.length * 0.5)] : 0;
const p95 = latencies.length ? latencies[Math.floor(latencies.length * 0.95)] : 0;
const elapsedMs = Date.now() - t0;

const report = {
  schema_version: 'freeaiSoakEnergyReport.v1',
  phase: 'freeai_soak_energy',
  generated_at: new Date().toISOString(),
  verdict: failed === 0 ? 'PASS' : 'FAIL',
  baseline_id: BASELINE_ID,
  config_profile: {
    soak_concurrency: CONCURRENCY,
    soak_duration_s: DURATION_S,
    soak_workers: WORKERS,
    receipt_mode: 'none',
  },
  provenance: {
    git_head: currentGitHead(),
    node_version: process.version,
    ci_run_id: String(process.env.GITHUB_RUN_ID || '').trim() || null,
  },
  soak: {
    duration_s: DURATION_S,
    concurrency: CONCURRENCY,
    total_runs: submitted,
    ok_runs: ok,
    failed_runs: failed,
    success_rate_percent: submitted ? Number(((ok / submitted) * 100).toFixed(2)) : 0,
    throughput_runs_per_sec: elapsedMs > 0 ? Number(((submitted / elapsedMs) * 1000).toFixed(2)) : 0,
    latency_ms: { p50, p95 },
  },
  power_energy_proxy: telemetry,
};

const persisted = persistSoakReport(report);
await emitMetric({
  event: 'soak_report_written',
  verdict: report.verdict,
  report_path: persisted.filePath,
  throughput_runs_per_sec: report.soak.throughput_runs_per_sec,
  p95_latency_ms: report.soak.latency_ms.p95,
  success_rate_percent: report.soak.success_rate_percent,
}).catch(() => {});

console.log(JSON.stringify(report, null, 2));
console.log(`soak_report_path: ${persisted.filePath}`);
console.log(`soak_index_path: ${persisted.indexPath}`);
if (failed > 0) process.exit(1);

