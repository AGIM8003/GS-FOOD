#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function parseArgs(argv) {
  const out = {};
  for (const arg of argv.slice(2)) {
    const m = /^--([^=]+)=(.*)$/.exec(arg);
    if (!m) continue;
    out[m[1]] = m[2];
  }
  return out;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
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

function latestByGeneratedAt(rows) {
  return [...rows].sort((a, b) => String(b.generated_at || '').localeCompare(String(a.generated_at || '')))[0] || null;
}

function pctGapHigherIsBetter(ours, anchor) {
  if (!Number.isFinite(ours) || !Number.isFinite(anchor) || anchor <= 0) return null;
  return Number((((ours - anchor) / anchor) * 100).toFixed(2));
}

function pctGapLowerIsBetter(ours, anchor) {
  if (!Number.isFinite(ours) || !Number.isFinite(anchor) || anchor <= 0) return null;
  return Number((((anchor - ours) / anchor) * 100).toFixed(2));
}

function scoreFromGaps(gaps) {
  const vals = Object.values(gaps).filter((v) => Number.isFinite(v));
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Number(Math.max(0, Math.min(100, 50 + avg)).toFixed(2));
}

function loadAnchor(anchorPath) {
  if (!anchorPath) return null;
  const resolved = path.resolve(anchorPath);
  if (!fs.existsSync(resolved)) return null;
  const doc = readJson(resolved);
  if (!doc) return null;
  return {
    source: doc.source || 'manual_anchor',
    updated_at: doc.updated_at || null,
    benchmark: doc.benchmark || null,
    soak: doc.soak || null,
  };
}

function buildScorecard(root, anchor) {
  const benchRows = readJsonl(path.join(root, 'evidence', 'reports', 'benchmark', 'index.jsonl'));
  const soakRows = readJsonl(path.join(root, 'evidence', 'reports', 'soak', 'index.jsonl'));
  const benchLatest = latestByGeneratedAt(benchRows);
  const soakLatest = latestByGeneratedAt(soakRows);

  const benchmarkGaps = {
    throughput_gap_percent: anchor?.benchmark ? pctGapHigherIsBetter(Number(benchLatest?.throughput_runs_per_sec), Number(anchor.benchmark.throughput_runs_per_sec)) : null,
    p95_latency_gap_percent: anchor?.benchmark ? pctGapLowerIsBetter(Number(benchLatest?.p95_latency_ms), Number(anchor.benchmark.p95_latency_ms)) : null,
    success_rate_gap_percent: anchor?.benchmark ? pctGapHigherIsBetter(Number(benchLatest?.success_rate_percent), Number(anchor.benchmark.success_rate_percent)) : null,
  };
  const soakGaps = {
    throughput_gap_percent: anchor?.soak ? pctGapHigherIsBetter(Number(soakLatest?.throughput_runs_per_sec), Number(anchor.soak.throughput_runs_per_sec)) : null,
    p95_latency_gap_percent: anchor?.soak ? pctGapLowerIsBetter(Number(soakLatest?.p95_latency_ms), Number(anchor.soak.p95_latency_ms)) : null,
    success_rate_gap_percent: anchor?.soak ? pctGapHigherIsBetter(Number(soakLatest?.success_rate_percent), Number(anchor.soak.success_rate_percent)) : null,
  };

  return {
    schema_version: 'freeaiCompetitivenessScorecard.v1',
    generated_at: new Date().toISOString(),
    anchor_source: anchor?.source || null,
    benchmark_latest: benchLatest,
    soak_latest: soakLatest,
    benchmark_gap_percent: benchmarkGaps,
    soak_gap_percent: soakGaps,
    score: {
      benchmark_score_0_100: scoreFromGaps(benchmarkGaps),
      soak_score_0_100: scoreFromGaps(soakGaps),
      overall_score_0_100: scoreFromGaps({ ...benchmarkGaps, ...soakGaps }),
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const root = process.cwd();
  const anchor = loadAnchor(args.anchor || process.env.FREEAI_SCORECARD_ANCHOR_JSON || '');
  const scorecard = buildScorecard(root, anchor);
  const reportsDir = path.join(root, 'evidence', 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  const outPath = args.out
    ? path.resolve(args.out)
    : path.join(reportsDir, `competitiveness-scorecard-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(scorecard, null, 2));

  const latestPath = path.join(reportsDir, 'competitiveness-scorecard-latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(scorecard, null, 2));
  console.log(JSON.stringify({ out_path: outPath, latest_path: latestPath, overall_score_0_100: scorecard.score.overall_score_0_100 }, null, 2));
}

main();

