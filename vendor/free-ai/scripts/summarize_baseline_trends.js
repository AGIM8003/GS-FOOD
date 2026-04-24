#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function parseArgs(argv) {
  const out = {};
  for (const a of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(a);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function computeDelta(rows, fields) {
  const latest = rows.at(-1) || null;
  const prev = rows.length >= 2 ? rows.at(-2) : null;
  if (!latest) return { latest: null, previous: null, delta: null };
  if (!prev) return { latest, previous: null, delta: null };
  const delta = {};
  for (const key of fields) {
    const l = Number(latest[key]);
    const p = Number(prev[key]);
    delta[key] = Number.isFinite(l) && Number.isFinite(p) ? Number((l - p).toFixed(3)) : null;
  }
  return { latest, previous: prev, delta };
}

function buildTrendSummary(root) {
  const soakRows = readJsonl(path.join(root, 'evidence', 'reports', 'soak', 'index.jsonl'));
  const benchRows = readJsonl(path.join(root, 'evidence', 'reports', 'benchmark', 'index.jsonl'));
  return {
    schema_version: 'freeaiBaselineTrendSummary.v1',
    generated_at: new Date().toISOString(),
    soak: {
      samples: soakRows.length,
      ...computeDelta(soakRows, ['throughput_runs_per_sec', 'p95_latency_ms', 'success_rate_percent', 'cpu_util_approx_percent', 'rss_delta_mb']),
    },
    benchmark: {
      samples: benchRows.length,
      ...computeDelta(benchRows, ['throughput_runs_per_sec', 'p95_latency_ms', 'success_rate_percent', 'iterations']),
    },
  };
}

const args = parseArgs(process.argv);
const root = process.cwd();
const summary = buildTrendSummary(root);
const outPath = args.out ? path.resolve(args.out) : null;

if (outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
}
console.log(JSON.stringify(summary, null, 2));

