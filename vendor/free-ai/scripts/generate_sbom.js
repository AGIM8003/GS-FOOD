#!/usr/bin/env node
/**
 * Generate CycloneDX SBOM for supply-chain evidence (CI / release).
 * Requires network on first npx fetch of @cyclonedx/cyclonedx-npm.
 */
import { spawnSync } from 'child_process';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'sbom.json');

const r = spawnSync('npx', ['--yes', '@cyclonedx/cyclonedx-npm', '--output-file', outFile], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (r.status !== 0) {
  console.error('SBOM generation failed; install deps with npm ci and retry.');
  process.exit(r.status || 2);
}
console.log('SBOM written to', outFile);
process.exit(0);
