import fs from 'fs';
import path from 'path';

const agentsPath = path.join(process.cwd(), 'AGENTS.md');
const manifestPath = path.join(process.cwd(), 'freeai.engine.manifest.json');

if (!fs.existsSync(agentsPath)) {
  console.error('AGENTS.md missing');
  process.exit(2);
}

if (!fs.existsSync(manifestPath)) {
  console.error('freeai.engine.manifest.json missing');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (manifest.engine_type !== 'copy-only-runtime-module') {
  console.error('engine manifest has wrong engine_type');
  process.exit(2);
}

if (!manifest.integration_policy?.full_local_copy_required || !manifest.integration_policy?.forbid_wrapper_usage) {
  console.error('engine manifest integration policy is incomplete');
  process.exit(2);
}

if (!Array.isArray(manifest.pipeline) || manifest.pipeline.length < 8) {
  console.error('engine manifest pipeline incomplete');
  process.exit(2);
}

if (!manifest.authoritative_files.includes('AGENTS.md')) {
  console.error('engine manifest missing AGENTS.md as authoritative');
  process.exit(2);
}

console.log('engine_manifest test OK');
