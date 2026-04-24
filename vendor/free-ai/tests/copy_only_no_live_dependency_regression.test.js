import assert from 'assert';
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'freeai.engine.manifest.json'), 'utf8'));
const auth = manifest.authoritative_files || [];
assert.ok(auth.includes('docs/COPY_ONLY_EMBED_POLICY.md'));
assert.strictEqual(manifest.integration_policy?.forbid_live_reference_usage, true);
assert.strictEqual(manifest.engine_type, 'copy-only-runtime-module');

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const deps = { ...(pkg.dependencies || {}), ...(pkg.optionalDependencies || {}), ...(pkg.peerDependencies || {}) };
for (const [k, v] of Object.entries(deps)) {
  const val = String(v);
  assert.ok(!val.startsWith('file:'), `dependency ${k} must not use file: protocol`);
  assert.ok(!val.includes('github.com'), `dependency ${k} must not point at live git`);
}

console.log('copy_only_no_live_dependency_regression test OK');
