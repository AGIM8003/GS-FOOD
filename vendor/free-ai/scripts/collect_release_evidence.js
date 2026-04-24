#!/usr/bin/env node
/**
 * Collects a release evidence folder: quality gate JSON, SBOM, control matrix snapshot, summary metadata.
 * Run from the engine root after `npm ci`. Output defaults to dist/release-evidence-<timestamp>/ (gitignored).
 *
 * Env: EVIDENCE_OUT=/path/to/dir — explicit output directory (parent must exist or will be created).
 * Arg: --fast — pass --fast to quality_gate (skips smoke in gate).
 *
 * Usage: node scripts/collect_release_evidence.js
 *         node scripts/collect_release_evidence.js --fast
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = process.cwd();
const fast = process.argv.includes('--fast');
const outDir =
  process.env.EVIDENCE_OUT ||
  path.join(root, 'dist', `release-evidence-${Date.now()}`);

function copyFile(srcRel, destName) {
  const src = path.join(root, srcRel);
  if (!fs.existsSync(src)) return { copied: false, reason: 'missing', src: srcRel };
  fs.copyFileSync(src, path.join(outDir, destName));
  return { copied: true, src: srcRel };
}

function latestGateReport() {
  const dir = path.join(root, 'evidence', 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('local-quality-gate-') && f.endsWith('.json'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

function latestSoakReport() {
  const dir = path.join(root, 'evidence', 'reports', 'soak');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('soak-energy-') && f.endsWith('.json'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

function latestAdminTenantCoverageReport() {
  const dir = path.join(root, 'evidence', 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('admin-tenant-coverage-') && f.endsWith('.json'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

function latestCompetitivenessScorecard() {
  const dir = path.join(root, 'evidence', 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('competitiveness-scorecard-') && f.endsWith('.json') && !f.includes('latest'))
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const gateArgs = ['scripts/quality_gate.js'];
  if (fast) gateArgs.push('--fast');
  const gate = spawnSync('node', gateArgs, {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, FREEAI_COLLECT_INVOKED: '1' },
  });
  if (gate.status !== 0) {
    console.error('collect_release_evidence: quality_gate failed', gate.stderr?.slice(-2000));
    process.exit(gate.status || 2);
  }

  const gatePath = latestGateReport();
  if (gatePath) {
    fs.copyFileSync(gatePath, path.join(outDir, 'quality_gate.json'));
  }
  const soakPath = latestSoakReport();
  if (soakPath) {
    fs.copyFileSync(soakPath, path.join(outDir, 'soak_latest.json'));
  }

  spawnSync('node', ['scripts/admin_tenant_coverage_report.js'], { cwd: root, encoding: 'utf8' });
  const coveragePath = latestAdminTenantCoverageReport();
  if (coveragePath) {
    fs.copyFileSync(coveragePath, path.join(outDir, 'admin_tenant_coverage.json'));
  }

  const trendsOut = path.join(outDir, 'baseline_trends.json');
  const trends = spawnSync('node', ['scripts/summarize_baseline_trends.js', `--out=${trendsOut}`], {
    cwd: root,
    encoding: 'utf8',
  });
  if (trends.status !== 0 && fs.existsSync(trendsOut)) {
    fs.rmSync(trendsOut, { force: true });
  }

  const scorecardOut = path.join(outDir, 'competitiveness_scorecard.json');
  const scorecardArgs = ['scripts/build_competitiveness_scorecard.js', `--out=${scorecardOut}`];
  if (process.env.FREEAI_SCORECARD_ANCHOR_JSON) {
    scorecardArgs.push(`--anchor=${process.env.FREEAI_SCORECARD_ANCHOR_JSON}`);
  }
  const scorecard = spawnSync('node', scorecardArgs, {
    cwd: root,
    encoding: 'utf8',
  });
  if (scorecard.status !== 0 && fs.existsSync(scorecardOut)) {
    fs.rmSync(scorecardOut, { force: true });
  }
  const scorecardPath = fs.existsSync(scorecardOut) ? scorecardOut : latestCompetitivenessScorecard();
  if (scorecardPath && scorecardPath !== scorecardOut) {
    fs.copyFileSync(scorecardPath, path.join(outDir, 'competitiveness_scorecard.json'));
  }

  const lockTelemetrySummaryOut = path.join(outDir, 'lock_telemetry_summary.json');
  const metricsPath = process.env.FREEAI_METRICS_JSONL || path.join(root, 'data', 'metrics.jsonl');
  let lockSummary = {
    schema_version: 'freeaiLockTelemetrySummary.v1',
    generated_at: new Date().toISOString(),
    source_metrics_file: metricsPath,
    by_event: {},
    total_events: 0,
  };
  try {
    if (fs.existsSync(metricsPath)) {
      const lines = fs.readFileSync(metricsPath, 'utf8').split('\n').filter(Boolean);
      const byEvent = {};
      for (const line of lines) {
        try {
          const row = JSON.parse(line);
          if (row.subsystem !== 'training_cycle_lock') continue;
          const ev = String(row.event || 'unknown');
          byEvent[ev] = (byEvent[ev] || 0) + 1;
        } catch {
          /* ignore */
        }
      }
      lockSummary = {
        ...lockSummary,
        by_event: byEvent,
        total_events: Object.values(byEvent).reduce((a, b) => a + b, 0),
      };
    }
  } catch {
    /* ignore */
  }
  fs.writeFileSync(lockTelemetrySummaryOut, JSON.stringify(lockSummary, null, 2));

  spawnSync('node', ['scripts/generate_sbom.js'], { cwd: root, encoding: 'utf8' });
  const sbomSrc = path.join(root, 'dist', 'sbom.json');
  if (fs.existsSync(sbomSrc)) {
    fs.copyFileSync(sbomSrc, path.join(outDir, 'sbom.json'));
  }

  copyFile('docs/ENTERPRISE_CONTROL_MATRIX.md', 'ENTERPRISE_CONTROL_MATRIX.md');

  let gitHead = null;
  const gr = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (gr.status === 0) gitHead = String(gr.stdout || '').trim();

  const index = {
    generated_at: new Date().toISOString(),
    output_dir: outDir,
    git_head: gitHead,
    node: process.version,
    quality_gate_fast: fast,
    files: {
      quality_gate: gatePath ? 'quality_gate.json' : null,
      soak_latest: soakPath ? 'soak_latest.json' : null,
      admin_tenant_coverage: coveragePath ? 'admin_tenant_coverage.json' : null,
      baseline_trends: fs.existsSync(path.join(outDir, 'baseline_trends.json')) ? 'baseline_trends.json' : null,
      competitiveness_scorecard: fs.existsSync(path.join(outDir, 'competitiveness_scorecard.json')) ? 'competitiveness_scorecard.json' : null,
      lock_telemetry_summary: fs.existsSync(path.join(outDir, 'lock_telemetry_summary.json')) ? 'lock_telemetry_summary.json' : null,
      sbom: fs.existsSync(path.join(outDir, 'sbom.json')) ? 'sbom.json' : null,
      control_matrix: fs.existsSync(path.join(outDir, 'ENTERPRISE_CONTROL_MATRIX.md'))
        ? 'ENTERPRISE_CONTROL_MATRIX.md'
        : null,
    },
    next_steps: [
      'Attach this folder to your release ticket or artifact store.',
      'Complete docs/templates/TABLETOP_DRILL_RECORD.md after drills.',
      'See docs/ENTERPRISE_DEPLOY.md release checklist.',
    ],
  };
  fs.writeFileSync(path.join(outDir, 'INDEX.json'), JSON.stringify(index, null, 2));

  console.log('collect_release_evidence: wrote', outDir);
  process.exit(0);
}

main();
