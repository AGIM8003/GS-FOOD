import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const reportsDir = path.join(root, 'evidence', 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-thresholds-'));
const scorePath = path.join(reportsDir, `competitiveness-scorecard-${Date.now()}.json`);
const latestPath = path.join(reportsDir, 'competitiveness-scorecard-latest.json');
const priorLatest = fs.existsSync(latestPath) ? fs.readFileSync(latestPath, 'utf8') : null;

try {
  const body = {
    schema_version: 'freeaiCompetitivenessScorecard.v1',
    generated_at: new Date().toISOString(),
    score: { overall_score_0_100: 70 },
    benchmark_gap_percent: { p95_latency_gap_percent: -10, success_rate_gap_percent: 1 },
    soak_gap_percent: { p95_latency_gap_percent: -12, success_rate_gap_percent: 0.5 },
  };
  fs.writeFileSync(scorePath, JSON.stringify(body, null, 2), 'utf8');
  fs.writeFileSync(latestPath, JSON.stringify(body, null, 2), 'utf8');

  const ok = spawnSync('node', ['scripts/verify_competitiveness_thresholds.js'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, FREEAI_MIN_COMPETITIVENESS_SCORE: '60' },
  });
  if (ok.status !== 0) {
    console.error(ok.stdout, ok.stderr);
  }
  assert.strictEqual(ok.status, 0);

  const fail = spawnSync('node', ['scripts/verify_competitiveness_thresholds.js'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, FREEAI_MIN_COMPETITIVENESS_SCORE: '90' },
  });
  assert.strictEqual(fail.status, 2);

  console.log('verify_competitiveness_thresholds test OK');
} finally {
  fs.rmSync(scorePath, { force: true });
  if (priorLatest === null) fs.rmSync(latestPath, { force: true });
  else fs.writeFileSync(latestPath, priorLatest, 'utf8');
  fs.rmSync(tmp, { recursive: true, force: true });
}

