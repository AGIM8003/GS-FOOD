import assert from 'assert';
import { spawn } from 'child_process';

const port = 3311;
const baseUrl = `http://127.0.0.1:${port}`;

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

const child = spawn('node', ['src/server.js'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stderr = '';
child.stderr.on('data', (chunk) => {
  stderr += chunk.toString();
});

try {
  await waitFor(`${baseUrl}/health/startup`);
  const readyRes = await waitFor(`${baseUrl}/health/ready`);
  const ready = await readyRes.json();
  assert.equal(ready.status, 'ready');

  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  assert.equal(health.probes.live, true);
  assert.equal(health.probes.ready, true);
  assert.equal(health.probes.startup, true);

  const inferRes = await fetch(`${baseUrl}/v1/infer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'pricing fallback please' }),
  });
  const infer = await inferRes.json();
  assert.equal(infer.status, 200);
  assert.ok(infer.receipt);
  assert.ok(infer.body);
  console.log('smoke test OK');
} finally {
  child.kill();
  await sleep(200);
  if (!child.killed) child.kill('SIGKILL');
}

if (stderr.trim()) {
  console.error(stderr.trim());
}
