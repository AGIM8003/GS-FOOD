import assert from 'assert';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

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
    graph_id: 'adm-g',
    graph_name: 'adm',
    entry_node_id: 'p1',
    receipt_mode: 'none',
    input_payload: {},
    nodes: [
      {
        node_id: 'p1',
        node_type: 'prompt_node',
        role_id: 'r',
        task_lane: 'l',
        config: { prompt: 'Return JSON for tests.' },
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

const port = 3382;
const swarmDir = path.join(os.tmpdir(), `freeai-swarm-admin-${port}`);
const child = spawn('node', ['src/server.js'], {
  env: {
    ...process.env,
    PORT: String(port),
    FREEAI_SWARM_RUNS_DIR: swarmDir,
    FREEAI_ENFORCE_TENANT_ID: '1',
    FREEAI_ADMIN_ROLES: 'reader:admin_read,writer:admin_write',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitFor(`http://127.0.0.1:${port}/health/ready`);

  const sum0 = await fetch(`http://127.0.0.1:${port}/admin/swarm-graph-summary`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(sum0.status, 200);
  const sumJ = await sum0.json();
  assert.strictEqual(sumJ.schema_version, 'freeaiSwarmGraphSummary.v2');
  assert.ok(typeof sumJ.runs_total === 'number');
  assert.strictEqual(sumJ.persistence_enabled, true);

  const sumNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-graph-summary`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(sumNoTenantWriter.status, 401);

  const postRes = await fetch(`http://127.0.0.1:${port}/v1/swarm/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant-a' },
    body: JSON.stringify(minimalValidBody()),
  });
  assert.ok([200, 422].includes(postRes.status));
  const postJ = await postRes.json();
  assert.ok(postJ.run_id);

  const listRes = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(listRes.status, 200);
  const listJ = await listRes.json();
  assert.ok(Array.isArray(listJ.runs));
  assert.ok(listJ.runs.length >= 1);

  const listNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(listNoTenantWriter.status, 401);

  const listWrongTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs`, {
    headers: { 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(listWrongTenantWriter.status, 200);
  const listWrongTenantJ = await listWrongTenantWriter.json();
  assert.ok(Array.isArray(listWrongTenantJ.runs));
  assert.ok(!listWrongTenantJ.runs.some((r) => r.run_id === postJ.run_id));

  const detailRes = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(detailRes.status, 200);
  const detailJ = await detailRes.json();
  assert.strictEqual(detailJ.run.run_id, postJ.run_id);
  assert.ok(Array.isArray(detailJ.run.receipts));

  const miss = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/does-not-exist-zzzz`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(miss.status, 404);

  const noTenantRead = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs`, {
    headers: { 'X-Admin-Key': 'reader' },
  });
  assert.strictEqual(noTenantRead.status, 401);

  const streamWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/stream`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(streamWrongTenant.status, 404);

  const streamNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/stream`, {
    headers: { 'X-Admin-Key': 'reader' },
  });
  assert.strictEqual(streamNoTenant.status, 401);

  const snapsWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/snapshots`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(snapsWrongTenant.status, 404);

  const snapsSameTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/snapshots`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(snapsSameTenant.status, 200);

  const snapsNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/snapshots`, {
    headers: { 'X-Admin-Key': 'reader' },
  });
  assert.strictEqual(snapsNoTenant.status, 401);

  const snapsNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/snapshots`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(snapsNoTenantWriter.status, 401);

  const metricsWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/metrics`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(metricsWrongTenant.status, 404);

  const metricsSameTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/metrics`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.ok([200, 404].includes(metricsSameTenant.status));

  const metricsNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/metrics`, {
    headers: { 'X-Admin-Key': 'reader' },
  });
  assert.strictEqual(metricsNoTenant.status, 401);

  const metricsNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/metrics`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(metricsNoTenantWriter.status, 401);

  const costWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/cost-breakdown`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(costWrongTenant.status, 404);

  const costSameTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/cost-breakdown`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.ok([200, 404].includes(costSameTenant.status));

  const costNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/cost-breakdown`, {
    headers: { 'X-Admin-Key': 'reader' },
  });
  assert.strictEqual(costNoTenant.status, 401);

  const costNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/cost-breakdown`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(costNoTenantWriter.status, 401);

  const checkpointsNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-checkpoints`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(checkpointsNoTenantWriter.status, 401);

  const checkpointsWrongTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-checkpoints`, {
    headers: { 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(checkpointsWrongTenantWriter.status, 200);
  const checkpointsWrongTenantJ = await checkpointsWrongTenantWriter.json();
  assert.ok(Array.isArray(checkpointsWrongTenantJ.checkpoints));
  assert.ok(!checkpointsWrongTenantJ.checkpoints.some((c) => c.run_id === postJ.run_id));

  const traceNoTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-trace-summary`, {
    headers: { 'X-Admin-Key': 'writer' },
  });
  assert.strictEqual(traceNoTenantWriter.status, 401);

  const traceWrongTenantWriter = await fetch(`http://127.0.0.1:${port}/admin/swarm-trace-summary`, {
    headers: { 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(traceWrongTenantWriter.status, 200);
  const traceWrongTenantJ = await traceWrongTenantWriter.json();
  assert.ok(Array.isArray(traceWrongTenantJ.traces));
  assert.ok(!traceWrongTenantJ.traces.some((t) => t.run_id === postJ.run_id));

  const resumeReader = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
    body: JSON.stringify({ resumed_by: 'r' }),
  });
  assert.strictEqual(resumeReader.status, 403);

  const resumeWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
    body: JSON.stringify({ resumed_by: 'w' }),
  });
  assert.strictEqual(resumeWrongTenant.status, 404);

  const resumeNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/resume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer' },
    body: JSON.stringify({ resumed_by: 'w' }),
  });
  assert.strictEqual(resumeNoTenant.status, 401);

  const rewindReader = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/rewind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
    body: JSON.stringify({ snapshot_index: 0 }),
  });
  assert.strictEqual(rewindReader.status, 403);

  const rewindWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/rewind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
    body: JSON.stringify({ snapshot_index: 0 }),
  });
  assert.strictEqual(rewindWrongTenant.status, 404);

  const rewindNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-runs/${postJ.run_id}/rewind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer' },
    body: JSON.stringify({ snapshot_index: 0 }),
  });
  assert.strictEqual(rewindNoTenant.status, 401);

  const reviewGraph = {
    graph_id: 'adm-review',
    graph_name: 'adm review',
    entry_node_id: 'p1',
    receipt_mode: 'none',
    input_payload: {},
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'review pls' } },
      { node_id: 'h1', node_type: 'human_review_node', role_id: 'h', task_lane: 'l', config: { requested_action: 'approve_to_continue' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'm', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'f', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'h1' },
      { from_node_id: 'h1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };

  const reviewRunRes = await fetch(`http://127.0.0.1:${port}/v1/swarm/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tenant-a' },
    body: JSON.stringify(reviewGraph),
  });
  assert.strictEqual(reviewRunRes.status, 422);

  const reviewsA = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-a' },
  });
  assert.strictEqual(reviewsA.status, 200);
  const reviewsAJ = await reviewsA.json();
  assert.ok(Array.isArray(reviewsAJ.reviews));
  assert.ok(reviewsAJ.reviews.length >= 1);
  const reviewId = reviewsAJ.reviews[0].review_id;

  const reviewsB = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(reviewsB.status, 200);
  const reviewsBJ = await reviewsB.json();
  assert.ok(Array.isArray(reviewsBJ.reviews));
  assert.ok(!reviewsBJ.reviews.some((r) => r.review_id === reviewId));

  const reviewWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews/${reviewId}`, {
    headers: { 'X-Admin-Key': 'reader', 'X-Tenant-Id': 'tenant-b' },
  });
  assert.strictEqual(reviewWrongTenant.status, 404);

  const approveWrongTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews/${reviewId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-b' },
    body: JSON.stringify({ reviewer_id: 'ops-1' }),
  });
  assert.strictEqual(approveWrongTenant.status, 400);

  const approveNoTenant = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews/${reviewId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer' },
    body: JSON.stringify({ reviewer_id: 'ops-1' }),
  });
  assert.strictEqual(approveNoTenant.status, 401);

  const approveOk = await fetch(`http://127.0.0.1:${port}/admin/swarm-reviews/${reviewId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': 'writer', 'X-Tenant-Id': 'tenant-a' },
    body: JSON.stringify({ reviewer_id: 'ops-1' }),
  });
  assert.strictEqual(approveOk.status, 200);
} finally {
  child.kill();
  await sleep(200);
  if (!child.killed) child.kill('SIGKILL');
}

console.log('admin_swarm_v1_endpoints test OK');
