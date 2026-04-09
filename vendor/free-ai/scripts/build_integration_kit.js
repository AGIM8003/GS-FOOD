#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const root = process.cwd();
const manifestPath = path.join(root, 'freeai.engine.manifest.json');
const packagePath = path.join(root, 'package.json');
const envExamplePath = path.join(root, '.env.example');
const outDir = path.join(root, 'out', 'integration-kit');

if (!fs.existsSync(manifestPath)) {
  console.error('freeai.engine.manifest.json missing');
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const envExample = fs.existsSync(envExamplePath) ? fs.readFileSync(envExamplePath, 'utf8') : '';

fs.mkdirSync(outDir, { recursive: true });

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function listFilesRecursive(startPath) {
  if (!fs.existsSync(startPath)) return [];
  const stat = fs.statSync(startPath);
  if (stat.isFile()) return [startPath];
  const out = [];
  for (const entry of fs.readdirSync(startPath)) {
    out.push(...listFilesRecursive(path.join(startPath, entry)));
  }
  return out;
}

const authoritative = [];
for (const rel of manifest.authoritative_files || []) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  authoritative.push({ path: rel, sha256: sha256(abs), bytes: fs.statSync(abs).size });
}

const requiredInventory = [];
for (const rel of manifest.required_directories || []) {
  const abs = path.join(root, rel);
  for (const file of listFilesRecursive(abs)) {
    const repoRel = path.relative(root, file).replace(/\\/g, '/');
    requiredInventory.push({ path: repoRel, sha256: sha256(file), bytes: fs.statSync(file).size });
  }
}

const integrationManifest = {
  generated_at: new Date().toISOString(),
  engine_id: manifest.engine_id,
  bundle_type: 'host-integration-kit',
  source_manifest: 'freeai.engine.manifest.json',
  authoritative_files: authoritative,
  required_inventory: requiredInventory,
  env_keys: manifest.env_keys || [],
  entrypoints: manifest.entrypoints || {},
  http_surface: manifest.http_surface || {},
  copy_destinations: manifest.copy_destinations || [],
  verification_commands: manifest.verification_commands || [],
  host_execution_examples: manifest.host_execution_examples || {},
  host_scripts: {
    start: 'node src/server.js',
    quality_gate: 'node scripts/quality_gate.js --fast',
    test: 'node scripts/run_all_tests.js',
    probes: 'node scripts/run_provider_probes.js',
    project_eval: 'node scripts/evaluate_project.js',
    training_cycle: 'node scripts/run_training_cycle.js',
    training_report: 'node scripts/training_status_report.js',
    training_review: 'node scripts/training_review_report.js'
  },
  package_meta: {
    name: pkg.name,
    version: pkg.version,
    type: pkg.type,
    engines: pkg.engines || {}
  }
};

fs.writeFileSync(path.join(outDir, 'integration-manifest.json'), JSON.stringify(integrationManifest, null, 2));

const playbook = {
  generated_at: new Date().toISOString(),
  engine_id: manifest.engine_id,
  objective: 'Copy FREE AI into a host project as a full coherent local engine module without depending on the source repository at runtime.',
  recommended_destination: (manifest.copy_destinations || [])[0] || 'vendor/free-ai',
  integration_policy: manifest.integration_policy || {},
  required_directories: manifest.required_directories || [],
  authoritative_files: manifest.authoritative_files || [],
  runtime_state_directories: ['data', 'memory', 'evidence', 'acquisition'],
  verification_commands: manifest.verification_commands || [],
  post_merge_checks: manifest.merge_checklist || [],
  admin_endpoints: manifest.http_surface?.admin || [],
};

fs.writeFileSync(path.join(outDir, 'HOST_MERGE_PLAYBOOK.json'), JSON.stringify(playbook, null, 2));

const mergeGuide = [
  '# FREE AI Host Merge Guide',
  '',
  'This folder was generated from the local FREE AI engine to help another AI or engineer merge it into a host project safely.',
  '',
  'Owner-enforced rule: FREE AI must be copied fully into the host project. Using this source repository as a wrapper, shared runtime, or live reference is forbidden.',
  '',
  '## Required Copy Set',
  '',
  ...((manifest.required_directories || []).map((item) => `- ${item}/`)),
  ...((manifest.authoritative_files || []).map((item) => `- ${item}`)),
  '',
  '## Host Merge Steps',
  '',
  '1. Copy the full FREE AI engine into a dedicated local folder inside the host project such as `vendor/free-ai/`.',
  '2. Do not omit any required directories or authoritative files from the copied engine.',
  '3. Preserve relative paths and all writable state directories: `data/`, `memory/`, `evidence/`, and `acquisition/`.',
  '4. Do not point back to this repository with symlinks, wrappers, package aliases, or shared-source imports.',
  '5. Configure the required environment variables in the host project.',
  '6. Wire the host to either call `POST /v1/infer` over HTTP or instantiate the engine router in-process, but only from the copied local engine.',
  '7. Run the verification commands after integration.',
  '8. Verify prompt preview, validation, trace, training, route evidence, and receipt-chain integrity still work.',
  '',
  '## Run Commands',
  '',
  '```powershell',
  'node src/server.js',
  'node scripts/quality_gate.js --fast',
  'node scripts/run_all_tests.js',
  'node scripts/run_provider_probes.js',
  'node scripts/evaluate_project.js',
  'node scripts/run_training_cycle.js',
  'node scripts/training_status_report.js',
  'node scripts/training_review_report.js',
  '```',
  '',
  '## Fast Merge Pattern',
  '',
  'Use `vendor/free-ai/` in the host project, copy the full engine intact, keep folder-relative paths unchanged, and expose host scripts that call the vendored engine directly.',
  '',
  '## Environment Keys',
  '',
  ...((manifest.env_keys || []).map((item) => `- ${item}`)),
  '',
  '## Authoritative Inputs',
  '',
  '- AGENTS.md',
  '- freeai.engine.manifest.json',
  '- integration-manifest.json',
  '- integration-file-index.json',
  '- HOST_MERGE_PLAYBOOK.json',
  '- AGENT_TRANSFER_PROMPT.md',
  '- host-env.example',
  '- host-package-snippet.json'
].join('\n');

fs.writeFileSync(path.join(outDir, 'HOST_MERGE_GUIDE.md'), mergeGuide);

const transferPrompt = [
  '# FREE AI Agent Transfer Prompt',
  '',
  'Use the following prompt with another AI agent when you want it to extract FREE AI into a host project quickly and correctly.',
  '',
  '```text',
  'You are integrating the FREE AI engine into a host project. Treat FREE AI as a coherent local runtime module that must be copied in full, not as a few files to cherry-pick.',
  '',
  'Read first, in this order:',
  '1. AGENTS.md',
  '2. freeai.engine.manifest.json',
  '3. out/integration-kit/integration-manifest.json',
  '4. out/integration-kit/HOST_MERGE_GUIDE.md',
  '5. README.md',
  '6. FREEAI.md only if deeper architecture detail is needed',
  '7. .env.example to map required environment keys',
  '',
  'Your objective:',
  '- copy the full FREE AI engine into the host project under a dedicated folder such as vendor/free-ai/',
  '- preserve the runtime boundary, pipeline order, receipts, evidence, acquisition queue, and training state',
  '- make the copied engine fully local to the host project with no dependency back to the source repository',
  '- do not use the source repository as a wrapper, shared service, package reference, or live dependency',
  '',
  'Required copy set:',
  `- directories: ${(manifest.required_directories || []).join(', ')}`,
  `- authoritative files: ${(manifest.authoritative_files || []).join(', ')}`,
  '',
  'Non-negotiable rules:',
  '- do not rewrite the architecture into host-native fragments during the first merge',
  '- do not perform a partial copy; copy the full engine set required by the manifest',
  '- do not drop writable runtime folders: data, memory, evidence, acquisition',
  '- do not bypass translator, context, reasoning, persona, skills, prompt runtime, validation, or receipts',
  '- preserve admin and inspection endpoints or provide equivalent host access',
  '',
  'Required verification after copy:',
  ...(manifest.verification_commands || []).map((cmd) => `- ${cmd}`),
  '',
  'Also verify these HTTP/admin surfaces exist in the copied engine:',
  '- POST /v1/infer',
  '- GET /v1/stream',
  '- GET /health',
  '- GET /health/live',
  '- GET /health/ready',
  '- GET /health/startup',
  ...(manifest.http_surface?.admin || []).map((route) => `- ${route}`),
  '',
  'Merge process you must follow:',
  '1. copy the full engine into the host repo under a dedicated folder',
  '2. keep all runtime state folders writable and local to the copied engine',
  '3. configure environment keys from .env.example inside the host project',
  '4. run quality gate first, then tests, then host-specific boot verification',
  '5. report any host path/import rewrites explicitly before making them',
  '',
  'Deliverables expected from you:',
  '1. a short merge plan',
  '2. the exact destination path inside the host project',
  '3. the list of copied directories and files',
  '4. any import/path changes required for the host',
  '5. the host run/test commands',
  '6. a verification summary proving the vendored copy starts and passes checks',
  '',
  'Optimize for the fastest correct full-copy merge, not the smallest diff.',
  '```',
].join('\n');

fs.writeFileSync(path.join(outDir, 'AGENT_TRANSFER_PROMPT.md'), transferPrompt);
fs.writeFileSync(path.join(outDir, 'integration-file-index.json'), JSON.stringify(requiredInventory, null, 2));
fs.writeFileSync(path.join(outDir, 'host-env.example'), envExample);
fs.writeFileSync(path.join(outDir, 'host-package-snippet.json'), JSON.stringify({
  name: 'host-project-free-ai-snippet',
  scripts: {
    'freeai:start': 'node vendor/free-ai/src/server.js',
    'freeai:test': 'node vendor/free-ai/scripts/run_all_tests.js',
    'freeai:probes': 'node vendor/free-ai/scripts/run_provider_probes.js',
    'freeai:eval': 'node vendor/free-ai/scripts/evaluate_project.js',
    'freeai:training': 'node vendor/free-ai/scripts/run_training_cycle.js',
    'freeai:training-report': 'node vendor/free-ai/scripts/training_status_report.js',
    'freeai:training-review': 'node vendor/free-ai/scripts/training_review_report.js'
  },
  engines: pkg.engines || { node: '>=18' }
}, null, 2));

console.log('integration kit written to', outDir);
