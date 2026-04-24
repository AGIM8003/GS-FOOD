import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { Router } from '../src/server/router.js';

const cfg = { root: process.cwd(), providers: [] };
const router = new Router(cfg);
const sharedTaskId = `swarm-ci-task-${Date.now()}`;
const basePayload = {
  prompt: 'Swarm correlation test: list two risks for merging parallel subtask outputs.',
  preview_only: true,
  intent_family: 'swarm_task',
  swarm: { task_id: sharedTaskId, role: 'reviewer' },
};

const beforeMetrics = fs.existsSync(path.join(process.cwd(), 'data', 'metrics.jsonl'))
  ? fs.readFileSync(path.join(process.cwd(), 'data', 'metrics.jsonl'), 'utf8').split('\n').filter(Boolean).length
  : 0;

const res1 = await router.handleRequest({ ...basePayload, swarm: { ...basePayload.swarm, agent_id: 'w1' } });
const res2 = await router.handleRequest({ ...basePayload, swarm: { ...basePayload.swarm, agent_id: 'w2' } });

assert.strictEqual(res1.status, 200, `call1 status ${res1.status}`);
assert.strictEqual(res2.status, 200, `call2 status ${res2.status}`);
assert.strictEqual(res1.receipt?.intent_family, 'swarm_task', 'receipt1 intent_family');
assert.strictEqual(res2.receipt?.intent_family, 'swarm_task', 'receipt2 intent_family');
assert.strictEqual(res1.receipt?.swarm?.task_id, sharedTaskId);
assert.strictEqual(res2.receipt?.swarm?.task_id, sharedTaskId);
assert.strictEqual(res1.receipt?.persona?.id, 'swarm_role_reviewer');
assert.notStrictEqual(res1.receipt?.trace_id, res2.receipt?.trace_id);

const skillIds1 = (res1.receipt?.skills_loaded || []).map((s) => s.id);
assert.ok(skillIds1.some((id) => String(id).startsWith('swarm_')), `expected swarm_* skill, got ${skillIds1.join(',')}`);

const metricsPath = path.join(process.cwd(), 'data', 'metrics.jsonl');
if (fs.existsSync(metricsPath)) {
  const lines = fs.readFileSync(metricsPath, 'utf8').trim().split('\n').filter(Boolean);
  const newRows = lines.slice(beforeMetrics).map((l) => JSON.parse(l));
  const assign = newRows.filter((r) => r.event === 'freeai_swarm_assignment' && r.swarm_task_id === sharedTaskId);
  assert.strictEqual(assign.length, 2, `expected 2 freeai_swarm_assignment rows for task, got ${assign.length}`);
  const traces = new Set(assign.map((r) => r.trace_id));
  assert.strictEqual(traces.size, 2, 'assignment metrics should have distinct trace_id per call');
}

console.log('swarm_router_correlation test OK');
