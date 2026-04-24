import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root = process.cwd();
const manifestPath = path.join(root, 'freeai.engine.manifest.json');
const agentsPath = path.join(root, 'AGENTS.md');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const agentsMd = fs.readFileSync(agentsPath, 'utf8');

function extractAgentsMdAdminRoutes(md) {
  const lines = md.split('\n');
  const routes = [];
  let inAdminSection = false;
  for (const line of lines) {
    if (/^Admin and inspection endpoints:/.test(line)) {
      inAdminSection = true;
      continue;
    }
    if (inAdminSection) {
      const m = line.match(/^-\s+`([^`]+)`/);
      if (m) {
        routes.push(m[1]);
      } else if (line.trim() === '' || /^#/.test(line.trim())) {
        if (routes.length > 0) break;
      }
    }
  }
  return routes;
}

const manifestAdminRoutes = manifest.http_surface?.admin || [];
const agentsAdminRoutes = extractAgentsMdAdminRoutes(agentsMd);

console.log('agents_manifest_alignment tests:');

{
  const label = 'manifest admin routes are all listed in AGENTS.md';
  const missing = manifestAdminRoutes.filter((r) => !agentsAdminRoutes.includes(r));
  assert.deepStrictEqual(missing, [], `Missing in AGENTS.md: ${missing.join(', ')}`);
  console.log(`  PASS: ${label}`);
}

{
  const label = 'AGENTS.md admin routes are all listed in manifest';
  const extra = agentsAdminRoutes.filter((r) => !manifestAdminRoutes.includes(r));
  assert.deepStrictEqual(extra, [], `Extra in AGENTS.md not in manifest: ${extra.join(', ')}`);
  console.log(`  PASS: ${label}`);
}

{
  const label = 'AGENTS.md lists POST /v1/swarm/run as canonical entry point';
  assert.ok(agentsMd.includes('POST /v1/swarm/run'), 'POST /v1/swarm/run missing from AGENTS.md canonical entry points');
  console.log(`  PASS: ${label}`);
}

{
  const label = 'manifest includes /v1/swarm/run in http_surface';
  assert.ok(manifest.http_surface?.swarm_run === '/v1/swarm/run', 'swarm_run missing from manifest http_surface');
  console.log(`  PASS: ${label}`);
}

console.log('agents_manifest_alignment: all tests passed.');
