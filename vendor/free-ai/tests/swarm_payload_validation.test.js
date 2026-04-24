import assert from 'assert';
import { validateSwarmPayload, SWARM_MAX_CHILD_TRACE_IDS } from '../src/swarm/validateSwarmPayload.js';

const badUnknown = validateSwarmPayload({ task_id: 'x', extra_field: 1 });
assert.strictEqual(badUnknown.ok, false);

const badChildLen = validateSwarmPayload({
  task_id: 't',
  child_trace_ids: Array.from({ length: SWARM_MAX_CHILD_TRACE_IDS + 1 }, (_, i) => `c${i}`),
});
assert.strictEqual(badChildLen.ok, false);

const good = validateSwarmPayload({
  task_id: 'ok',
  role: 'reviewer',
  child_trace_ids: ['t-a', 't-b'],
  fan_in: true,
});
assert.strictEqual(good.ok, true);

const prev = process.env.FREEAI_VALIDATE_SWARM_PAYLOAD;
const prevNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = 'test';
process.env.FREEAI_VALIDATE_SWARM_PAYLOAD = '1';
const { Router } = await import('../src/server/router.js');
const router = new Router({ root: process.cwd(), providers: [] });
const res = await router.handleRequest({
  prompt: 'test',
  swarm: { task_id: 'x', child_trace_ids: Array.from({ length: SWARM_MAX_CHILD_TRACE_IDS + 2 }, (_, i) => `c${i}`) },
});
assert.strictEqual(res.status, 400);
assert.ok(String(res.error || '').includes('child_trace_ids'));
if (prev === undefined) delete process.env.FREEAI_VALIDATE_SWARM_PAYLOAD;
else process.env.FREEAI_VALIDATE_SWARM_PAYLOAD = prev;
if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
else process.env.NODE_ENV = prevNodeEnv;

console.log('swarm_payload_validation test OK');
