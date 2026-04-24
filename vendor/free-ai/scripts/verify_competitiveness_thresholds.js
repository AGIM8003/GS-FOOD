#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

function latestScorecard(root) {
  const dir = path.join(root, 'evidence', 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('competitiveness-scorecard-') && f.endsWith('.json') && !f.includes('latest'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

function n(v, fallback) {
  if (v === null || v === undefined || v === '') return fallback;
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function main() {
  const root = process.cwd();
  const p = latestScorecard(root);
  if (!p) {
    console.error('threshold_check_failed: scorecard_missing');
    process.exit(2);
  }
  const score = JSON.parse(fs.readFileSync(p, 'utf8'));
  const minOverall = n(process.env.FREEAI_MIN_COMPETITIVENESS_SCORE, 35);
  const maxP95Gap = n(process.env.FREEAI_MAX_P95_LATENCY_GAP_PCT, 50);
  const minSuccessGap = n(process.env.FREEAI_MIN_SUCCESS_GAP_PCT, -2);

  const overall = n(score?.score?.overall_score_0_100, -1);
  const benchP95Gap = n(score?.benchmark_gap_percent?.p95_latency_gap_percent, 0);
  const soakP95Gap = n(score?.soak_gap_percent?.p95_latency_gap_percent, 0);
  const benchSuccessGap = n(score?.benchmark_gap_percent?.success_rate_gap_percent, 0);
  const soakSuccessGap = n(score?.soak_gap_percent?.success_rate_gap_percent, 0);

  const failures = [];
  if (overall >= 0 && overall < minOverall) failures.push(`overall_score_below_min:${overall}<${minOverall}`);
  if (benchP95Gap < -maxP95Gap) failures.push(`benchmark_p95_gap_too_low:${benchP95Gap}<-${maxP95Gap}`);
  if (soakP95Gap < -maxP95Gap) failures.push(`soak_p95_gap_too_low:${soakP95Gap}<-${maxP95Gap}`);
  if (benchSuccessGap < minSuccessGap) failures.push(`benchmark_success_gap_too_low:${benchSuccessGap}<${minSuccessGap}`);
  if (soakSuccessGap < minSuccessGap) failures.push(`soak_success_gap_too_low:${soakSuccessGap}<${minSuccessGap}`);

  if (failures.length) {
    console.error('threshold_check_failed', JSON.stringify({ scorecard: p, failures }, null, 2));
    process.exit(2);
  }
  console.log(
    JSON.stringify(
      {
        status: 'PASS',
        scorecard: p,
        overall_score_0_100: overall,
        benchmark_p95_gap_percent: benchP95Gap,
        soak_p95_gap_percent: soakP95Gap,
      },
      null,
      2,
    ),
  );
}

main();

