#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { verifyReceiptLedger } from '../src/receipts.js';

const root = process.cwd();
const reportsDir = path.join(root, 'evidence', 'reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

const args = new Set(process.argv.slice(2));
const fast = args.has('--fast');

function runNode(commandArgs, label) {
  const result = spawnSync('node', commandArgs, { cwd: root, encoding: 'utf8' });
  return {
    label,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exit_code: result.status,
    stdout_tail: (result.stdout || '').trim().split('\n').slice(-10),
    stderr_tail: (result.stderr || '').trim().split('\n').slice(-10),
  };
}

function gateRequiredFiles() {
  const required = [
    'AGENTS.md',
    'README.md',
    'FREEAI.md',
    'freeai.engine.manifest.json',
    'providers.json',
    'src/server.js',
    'src/server/router.js',
    'scripts/build_integration_kit.js',
  ];
  const missing = required.filter((rel) => !fs.existsSync(path.join(root, rel)));
  return {
    status: missing.length === 0 ? 'PASS' : 'FAIL',
    checked: required.length,
    missing,
  };
}

function gateManifestConsistency() {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'freeai.engine.manifest.json'), 'utf8'));
  const missingAuthoritative = (manifest.authoritative_files || []).filter((rel) => !fs.existsSync(path.join(root, rel)));
  const missingDirectories = (manifest.required_directories || []).filter((rel) => !fs.existsSync(path.join(root, rel)));
  return {
    status: missingAuthoritative.length === 0 && missingDirectories.length === 0 ? 'PASS' : 'FAIL',
    missing_authoritative: missingAuthoritative,
    missing_directories: missingDirectories,
  };
}

function gateReceiptChain() {
  const ledger = verifyReceiptLedger();
  return {
    status: ledger.valid ? 'PASS' : 'FAIL',
    ledger,
  };
}

function gateIntegrationKit() {
  return runNode(['tests/integration_kit.test.js'], 'integration_kit');
}

function gateTests() {
  return runNode(['scripts/run_all_tests.js'], 'full_tests');
}

function gateSmoke() {
  return runNode(['tests/smoke.test.js'], 'smoke');
}

const stages = {
  required_files: gateRequiredFiles(),
  manifest_consistency: gateManifestConsistency(),
  receipt_chain: gateReceiptChain(),
  integration_kit: gateIntegrationKit(),
  tests: gateTests(),
  smoke: fast ? { status: 'SKIP', reason: '--fast mode' } : gateSmoke(),
};

const summary = {
  pass: Object.values(stages).filter((stage) => stage.status === 'PASS').length,
  fail: Object.values(stages).filter((stage) => stage.status === 'FAIL').length,
  skip: Object.values(stages).filter((stage) => stage.status === 'SKIP').length,
  total: Object.keys(stages).length,
};

const report = {
  generated_at: new Date().toISOString(),
  phase: 'freeai_local_quality_gate',
  stages,
  summary,
  verdict: summary.fail === 0 ? 'PASS' : 'FAIL',
};

const outPath = path.join(reportsDir, `local-quality-gate-${Date.now()}.json`);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

if (args.has('--json')) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`QUALITY GATE: ${report.verdict}`);
  console.log(`wrote ${outPath}`);
  for (const [name, stage] of Object.entries(stages)) {
    console.log(`${name}: ${stage.status}`);
  }
}

process.exit(report.verdict === 'PASS' ? 0 : 2);