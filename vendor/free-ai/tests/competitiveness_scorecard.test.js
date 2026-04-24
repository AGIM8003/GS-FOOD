import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const reportsDir = path.join(root, 'evidence', 'reports');
fs.mkdirSync(path.join(reportsDir, 'benchmark'), { recursive: true });
fs.mkdirSync(path.join(reportsDir, 'soak'), { recursive: true });

const benchIndex = path.join(reportsDir, 'benchmark', 'index.jsonl');
const soakIndex = path.join(reportsDir, 'soak', 'index.jsonl');
const benchBackup = fs.existsSync(benchIndex) ? fs.readFileSync(benchIndex, 'utf8') : null;
const soakBackup = fs.existsSync(soakIndex) ? fs.readFileSync(soakIndex, 'utf8') : null;

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-scorecard-'));
const anchorPath = path.join(tmpOut, 'anchor.json');
const outPath = path.join(tmpOut, 'competitiveness_scorecard.json');

try {
  fs.writeFileSync(
    benchIndex,
    JSON.stringify({
      generated_at: new Date().toISOString(),
      throughput_runs_per_sec: 10,
      p95_latency_ms: 100,
      success_rate_percent: 99,
    }) + '\n',
  );
  fs.writeFileSync(
    soakIndex,
    JSON.stringify({
      generated_at: new Date().toISOString(),
      throughput_runs_per_sec: 8,
      p95_latency_ms: 140,
      success_rate_percent: 98,
    }) + '\n',
  );

  fs.writeFileSync(
    anchorPath,
    JSON.stringify({
      source: 'test-anchor',
      updated_at: new Date().toISOString(),
      benchmark: {
        throughput_runs_per_sec: 12,
        p95_latency_ms: 90,
        success_rate_percent: 99.5,
      },
      soak: {
        throughput_runs_per_sec: 9,
        p95_latency_ms: 120,
        success_rate_percent: 99,
      },
    }, null, 2),
  );

  const run = spawnSync('node', ['scripts/build_competitiveness_scorecard.js', `--out=${outPath}`, `--anchor=${anchorPath}`], {
    cwd: root,
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    console.error(run.stdout, run.stderr);
  }
  assert.strictEqual(run.status, 0);
  assert.ok(fs.existsSync(outPath));
  const score = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  assert.strictEqual(score.schema_version, 'freeaiCompetitivenessScorecard.v1');
  assert.strictEqual(score.anchor_source, 'test-anchor');
  assert.ok(score.score);
  assert.ok(Object.prototype.hasOwnProperty.call(score.score, 'overall_score_0_100'));

  console.log('competitiveness_scorecard test OK');
} finally {
  if (benchBackup === null) fs.rmSync(benchIndex, { force: true });
  else fs.writeFileSync(benchIndex, benchBackup, 'utf8');
  if (soakBackup === null) fs.rmSync(soakIndex, { force: true });
  else fs.writeFileSync(soakIndex, soakBackup, 'utf8');
  fs.rmSync(tmpOut, { recursive: true, force: true });
}

