import assert from 'assert';
import { evaluatePolicy, POLICY_ZONES } from '../src/policy/policyFabric.js';

assert.ok(Array.isArray(POLICY_ZONES));
assert.ok(POLICY_ZONES.length >= 7);
assert.ok(POLICY_ZONES.includes('graph_admission'));
assert.ok(POLICY_ZONES.includes('node_execution'));
assert.ok(POLICY_ZONES.includes('merge_decision'));
assert.ok(POLICY_ZONES.includes('resume_execution'));
assert.ok(POLICY_ZONES.includes('tool_execution'));

{
  const r = evaluatePolicy('graph_admission', { graph: { graph_id: 'g', nodes: [], edges: [] } });
  assert.strictEqual(r.decision, 'allow');
  assert.strictEqual(r.policy_zone, 'graph_admission');
  assert.ok(r.policy_id);
  assert.ok(r.evaluated_at);
}

{
  const r = evaluatePolicy('graph_admission', { graph: null });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'missing_graph');
}

{
  const r = evaluatePolicy('node_execution', { node: { node_id: 'n1' }, run: { run_state: 'running' } });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('node_execution', { node: { node_id: 'n1' }, run: { run_id: 'x', run_state: 'quarantined' } });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'run_quarantined');
}

{
  const r = evaluatePolicy('merge_decision', { node: { node_id: 'm' }, branches: [{ ok: true }] });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('merge_decision', { node: { node_id: 'm' }, branches: [{ ok: false }] });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'all_branches_failed');
}

{
  const r = evaluatePolicy('resume_execution', {
    run: { run_id: 'r', resume_eligible: true, execution_checkpoint: 'n1', graph_hash: 'abc', graph_snapshot: {} },
  });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('resume_execution', {
    run: { run_id: 'r', resume_eligible: false },
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'not_resume_eligible');
}

{
  const r = evaluatePolicy('tool_execution', {
    tool_id: 'identity_transform',
    tool_class: 'local_transform',
    allow_network: false,
    allow_filesystem: false,
  });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('tool_execution', {
    tool_id: 'evil_tool',
    tool_class: 'arbitrary_shell',
    allow_network: false,
    allow_filesystem: false,
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'disallowed_tool_class');
}

{
  const r = evaluatePolicy('tool_execution', {
    tool_id: 'x',
    tool_class: 'local_transform',
    allow_network: true,
    allow_filesystem: false,
  });
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'network_access_denied');
}

{
  const r = evaluatePolicy('human_review_decision', {
    action: 'approve',
    review: { review_status: 'pending' },
    payload: { reviewer_id: 'ops-1' },
  });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('provider_model_eligibility', {
    node: { config: { provider_id: 'openai', model_id: 'gpt-4o-mini' } },
  });
  assert.strictEqual(r.decision, 'allow');
}

{
  const r = evaluatePolicy('unknown_zone', {});
  assert.strictEqual(r.decision, 'deny');
  assert.strictEqual(r.reason_code, 'unknown_zone');
}

console.log('policy_fabric_swarm test OK');
