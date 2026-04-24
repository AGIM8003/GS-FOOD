import assert from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { validateSwarmRunRequest } from '../src/server/validation/validateSwarmRunRequest.js';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(url, attempts = 40) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError || new Error(`failed waiting for ${url}`);
}

function minimalValidBody() {
  return {
    graph_id: 'api-g',
    graph_name: 'api',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    nodes: [
      {
        node_id: 'p1',
        node_type: 'prompt_node',
        role_id: 'r',
        task_lane: 'l',
        config: { prompt: 'ping' },
      },
      {
        node_id: 'm1',
        node_type: 'merge_node',
        role_id: 'm',
        task_lane: 'l',
        config: { merge_strategy: 'first_valid' },
      },
      {
        node_id: 'f1',
        node_type: 'finalization_node',
        role_id: 'f',
        task_lane: 'l',
        config: {},
      },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
}

{
  const bad = validateSwarmRunRequest({ graph_id: 'x' });
  assert.strictEqual(bad.ok, false);
  assert.ok(Array.isArray(bad.errors));
}

{
  const badRm = validateSwarmRunRequest({ ...minimalValidBody(), receipt_mode: 'invalid' });
  assert.strictEqual(badRm.ok, false);
}

{
  const ok = validateSwarmRunRequest(minimalValidBody());
  assert.strictEqual(ok.ok, true);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
assert.ok(serverSrc.includes("'/v1/swarm/run'"));
assert.ok(serverSrc.includes('validateSwarmRunRequest'));
assert.ok(!serverSrc.includes('FREEAI_SWARM_RELAX'));

const port = 3381;
const swarmDir = path.join(os.tmpdir(), `freeai-swarm-api-${port}`);
const child = spawn('node', ['src/server.js'], {
  env: { ...process.env, PORT: String(port), FREEAI_SWARM_RUNS_DIR: swarmDir },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitFor(`http://127.0.0.1:${port}/health/ready`);
  const badRes = await fetch(`http://127.0.0.1:${port}/v1/swarm/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph_id: '' }),
  });
  assert.strictEqual(badRes.status, 400);
  const badJson = await badRes.json();
  assert.strictEqual(badJson.error, 'swarm_validation_failed');

  const okRes = await fetch(`http://127.0.0.1:${port}/v1/swarm/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(minimalValidBody()),
  });
  assert.ok([200, 422].includes(okRes.status));
  const okJson = await okRes.json();
  assert.ok('run_id' in okJson);
} finally {
  child.kill();
  await sleep(200);
  if (!child.killed) child.kill('SIGKILL');
}

console.log('swarm_api_validation test OK');
