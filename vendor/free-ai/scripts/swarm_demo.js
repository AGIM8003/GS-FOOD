#!/usr/bin/env node
/**
 * Starts FREE AI on an ephemeral port, runs fan-out + fan-in preview, prints summary, exits.
 * Usage (from engine root): node scripts/swarm_demo.js
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { runSwarmFanoutDemo } from '../examples/swarm_host_orchestrator/lib.mjs';
import { getMetricsJsonlPath } from '../src/observability/metrics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitFor(url, attempts = 50) {
  let last = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      last = new Error(`status ${response.status}`);
    } catch (e) {
      last = e;
    }
    await sleep(200);
  }
  throw last || new Error('waitFor failed');
}

function countRecentMetricsForTask(taskId) {
  const metricsPath = getMetricsJsonlPath();
  if (!fs.existsSync(metricsPath)) return { gen_ai_infer: 0, freeai_swarm_assignment: 0 };
  const lines = fs.readFileSync(metricsPath, 'utf8').trim().split('\n').filter(Boolean);
  const tail = lines.slice(-300).map((l) => {
    try {
      return JSON.parse(l);
    } catch {
      return null;
    }
  }).filter(Boolean);
  let gen_ai_infer = 0;
  let freeai_swarm_assignment = 0;
  for (const r of tail) {
    if (r.swarm_task_id !== taskId) continue;
    if (r.event === 'gen_ai_infer') gen_ai_infer += 1;
    if (r.event === 'freeai_swarm_assignment') freeai_swarm_assignment += 1;
  }
  return { gen_ai_infer, freeai_swarm_assignment };
}

const port = 3400 + Math.floor(Math.random() * 400);
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn('node', ['src/server.js'], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
child.stderr?.on('data', (c) => {
  stderr += c.toString();
});

let exitCode = 2;
try {
  await waitFor(`${baseUrl}/health/startup`);
  await waitFor(`${baseUrl}/health/ready`);

  const out = await runSwarmFanoutDemo(baseUrl);
  const w1Ok = out.workerA.status === 200 && out.workerA.trace_id;
  const w2Ok = out.workerB.status === 200 && out.workerB.trace_id;
  const mergeOk = out.merge.status === 200 && out.merge.trace_id;

  if (!w1Ok || !w2Ok || !mergeOk) {
    console.error('swarm_demo: step failed', JSON.stringify(out, null, 2));
    process.exitCode = 2;
  } else {
    const metrics = countRecentMetricsForTask(out.taskId);
    console.log('SWARM DEMO OK');
    console.log(`  task_id:              ${out.taskId}`);
    console.log(`  worker_a trace_id:    ${out.workerA.trace_id}`);
    console.log(`  worker_b trace_id:    ${out.workerB.trace_id}`);
    console.log(`  merge trace_id:       ${out.merge.trace_id}`);
    console.log(`  merge receipt.swarm:  ${JSON.stringify(out.merge.receipt_swarm)}`);
    console.log(`  metrics (tail, task): gen_ai_infer=${metrics.gen_ai_infer} freeai_swarm_assignment=${metrics.freeai_swarm_assignment}`);
    exitCode = 0;
  }
} catch (e) {
  console.error('swarm_demo error:', e?.message || e);
  if (stderr.trim()) console.error(stderr.trim());
  exitCode = 2;
} finally {
  child.kill();
  await sleep(250);
  if (!child.killed) child.kill('SIGKILL');
}

process.exit(exitCode);
