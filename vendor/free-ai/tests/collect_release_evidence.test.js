import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

/** Avoid recursive full-suite when collect_release_evidence.js runs quality_gate → run_all_tests. */
if (process.env.FREEAI_COLLECT_INVOKED === '1') {
  console.log('collect_release_evidence test OK (skipped nested gate invocation)');
  process.exit(0);
}

const root = process.cwd();
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'freeai-evidence-'));

const r = spawnSync('node', ['scripts/collect_release_evidence.js', '--fast'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, EVIDENCE_OUT: out },
});
if (r.status !== 0) {
  console.error(r.stdout, r.stderr);
}
assert.strictEqual(r.status, 0, 'collect_release_evidence should pass with --fast');

const idx = path.join(out, 'INDEX.json');
assert.ok(fs.existsSync(idx), 'INDEX.json missing');
const qg = path.join(out, 'quality_gate.json');
assert.ok(fs.existsSync(qg), 'quality_gate.json missing');

fs.rmSync(out, { recursive: true, force: true });

console.log('collect_release_evidence test OK');
