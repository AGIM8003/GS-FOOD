import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const outDir = path.join(process.cwd(), 'out', 'integration-kit');
if (!fs.existsSync(path.join(outDir, 'integration-manifest.json'))) {
  execSync('node scripts/build_integration_kit.js', { stdio: 'inherit' });
}

const required = [
  'integration-manifest.json',
  'integration-file-index.json',
  'HOST_MERGE_GUIDE.md',
  'HOST_MERGE_PLAYBOOK.json',
  'AGENT_TRANSFER_PROMPT.md',
  'host-env.example',
  'host-package-snippet.json'
];

for (const file of required) {
  if (!fs.existsSync(path.join(outDir, file))) {
    console.error(`missing integration kit file: ${file}`);
    process.exit(2);
  }
}

const manifest = JSON.parse(fs.readFileSync(path.join(outDir, 'integration-manifest.json'), 'utf8'));
if (manifest.bundle_type !== 'host-integration-kit') {
  console.error('invalid integration kit manifest type');
  process.exit(2);
}
if (!Array.isArray(manifest.authoritative_files) || manifest.authoritative_files.length === 0) {
  console.error('integration kit authoritative files missing');
  process.exit(2);
}

console.log('integration_kit test OK');
