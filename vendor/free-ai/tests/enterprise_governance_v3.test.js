import assert from 'assert';
import { parseAdminRoles, resolveAdminRole, isTenantEnforcementEnabled, extractTenantId, VALID_ROLES } from '../src/security/adminRoles.js';
import { computeReceiptHmac, verifyReceiptChain } from '../src/swarm/receiptChainHmac.js';
import { __resetSwarmStoreForTests, getRun } from '../src/swarm/graphStateStore.js';
import { __resetReviewsForTests } from '../src/swarm/humanReviewGate.js';
import { runSwarmGraph } from '../src/swarm/runSwarmGraph.js';

process.env.FREEAI_SWARM_PERSIST = '';

assert.deepStrictEqual(VALID_ROLES, ['admin_read', 'admin_write']);

{
  process.env.FREEAI_ADMIN_ROLES = 'key1:admin_read,key2:admin_write';
  const map = parseAdminRoles();
  assert.strictEqual(map.get('key1'), 'admin_read');
  assert.strictEqual(map.get('key2'), 'admin_write');
  delete process.env.FREEAI_ADMIN_ROLES;
}

{
  process.env.FREEAI_ADMIN_ROLES = '';
  const map = parseAdminRoles();
  assert.strictEqual(map.size, 0);
}

{
  process.env.FREEAI_ADMIN_ROLES = 'rkey:admin_read,wkey:admin_write';
  const role = resolveAdminRole({ headers: { 'x-admin-key': 'rkey' } }, {});
  assert.strictEqual(role, 'admin_read');
  const role2 = resolveAdminRole({ headers: { 'x-admin-key': 'wkey' } }, {});
  assert.strictEqual(role2, 'admin_write');
  const role3 = resolveAdminRole({ headers: { 'x-admin-key': 'badkey' } }, {});
  assert.strictEqual(role3, null);
  delete process.env.FREEAI_ADMIN_ROLES;
}

{
  process.env.FREEAI_ENFORCE_TENANT_ID = '1';
  assert.strictEqual(isTenantEnforcementEnabled(), true);
  delete process.env.FREEAI_ENFORCE_TENANT_ID;
  assert.strictEqual(isTenantEnforcementEnabled(), false);
}

{
  const tid = extractTenantId({ headers: { 'x-tenant-id': 'tenant-abc' } });
  assert.strictEqual(tid, 'tenant-abc');
  const noTid = extractTenantId({ headers: {} });
  assert.strictEqual(noTid, null);
}

{
  const receipt1 = {
    receipt_id: 'sr-1',
    receipt_type: 'graph_receipt',
    run_id: 'r1',
    timestamp: '2026-01-01T00:00:00.000Z',
    inputs_hash: 'abc',
    outputs_hash: 'def',
  };
  const hmac1 = computeReceiptHmac(receipt1, null);
  assert.ok(typeof hmac1 === 'string');
  assert.ok(hmac1.length > 0);

  const hmac2 = computeReceiptHmac(receipt1, hmac1);
  assert.ok(hmac2 !== hmac1, 'Different previous HMAC should produce different result');
}

{
  const receipts = [
    { receipt_id: 'r1', receipt_type: 'graph_receipt', run_id: 'x', timestamp: 't1', inputs_hash: 'a', outputs_hash: 'b' },
    { receipt_id: 'r2', receipt_type: 'node_receipt', run_id: 'x', timestamp: 't2', inputs_hash: 'c', outputs_hash: 'd' },
  ];
  let prevHmac = null;
  for (const r of receipts) {
    r.chain_hmac = computeReceiptHmac(r, prevHmac);
    prevHmac = r.chain_hmac;
  }
  const result = verifyReceiptChain(receipts);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.chain_length, 2);
}

{
  const receipts = [
    { receipt_id: 'r1', receipt_type: 'graph_receipt', run_id: 'x', timestamp: 't1', inputs_hash: 'a', outputs_hash: 'b', chain_hmac: 'tampered' },
  ];
  const result = verifyReceiptChain(receipts);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.reason, 'hmac_mismatch');
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

{
  const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });
  const graph = {
    graph_id: 'hmac-test',
    graph_name: 'HMAC Chain',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
  const result = await runSwarmGraph(graph, { executePromptNode: stubExec });
  assert.strictEqual(result.ok, true);

  const run = getRun(result.run_id);
  assert.ok(run.receipts.every((r) => r.chain_hmac), 'All receipts should have chain_hmac');
  const chainResult = verifyReceiptChain(run.receipts);
  assert.strictEqual(chainResult.valid, true);
}

__resetSwarmStoreForTests();
__resetReviewsForTests();

{
  const stubExec = async (ctx) => ({ output: `out-${ctx.node.node_id}`, meta: {} });
  const graph = {
    graph_id: 'tenant-test',
    graph_name: 'Tenant',
    entry_node_id: 'p1',
    receipt_mode: 'full',
    input_payload: {},
    nodes: [
      { node_id: 'p1', node_type: 'prompt_node', role_id: 'r', task_lane: 'l', config: { prompt: 'a' } },
      { node_id: 'm1', node_type: 'merge_node', role_id: 'mr', task_lane: 'l', config: { merge_strategy: 'first_valid' } },
      { node_id: 'f1', node_type: 'finalization_node', role_id: 'fin', task_lane: 'l', config: {} },
    ],
    edges: [
      { from_node_id: 'p1', to_node_id: 'm1' },
      { from_node_id: 'm1', to_node_id: 'f1' },
    ],
  };
  const result = await runSwarmGraph(graph, { executePromptNode: stubExec, tenant_id: 'tenant-xyz' });
  assert.strictEqual(result.ok, true);
  const run = getRun(result.run_id);
  assert.strictEqual(run.tenant_id, 'tenant-xyz');
}

__resetSwarmStoreForTests();

console.log('enterprise_governance_v3 test OK');
