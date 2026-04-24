/**
 * Fail-closed checks: copy-only policy stays wired in the engine manifest.
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root = process.cwd();
const manifestPath = path.join(root, 'freeai.engine.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const auth = manifest.authoritative_files || [];
assert.ok(
  auth.includes('docs/COPY_ONLY_EMBED_POLICY.md'),
  'authoritative_files must list docs/COPY_ONLY_EMBED_POLICY.md',
);

const checklist = (manifest.merge_checklist || []).join('\n');
assert.ok(
  checklist.includes('COPY_ONLY_EMBED_POLICY') || checklist.includes('copy-embedded'),
  'merge_checklist must mention copy-only embed policy',
);

assert.strictEqual(
  manifest.integration_policy?.forbid_live_reference_usage,
  true,
  'integration_policy.forbid_live_reference_usage must stay true',
);

console.log('manifest_copy_only_alignment test OK');
