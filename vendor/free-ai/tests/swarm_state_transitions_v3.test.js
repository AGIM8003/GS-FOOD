import assert from 'assert';
import { assertRunTransition, assertNodeTransition, RUN_STATES, NODE_STATES } from '../src/swarm/transitionReducer.js';

function expectThrow(fn, pattern) {
  let threw = false;
  try { fn(); } catch (e) { threw = true; if (pattern) assert.ok(e.message.includes(pattern), e.message); }
  assert.ok(threw, 'expected throw');
}

assert.ok(RUN_STATES.includes('paused_for_review'));
assert.ok(RUN_STATES.includes('resumable'));
assert.ok(RUN_STATES.includes('resumed'));
assert.ok(RUN_STATES.includes('rejected'));
assert.ok(RUN_STATES.includes('quarantined'));
assert.ok(NODE_STATES.includes('waiting_human_review'));
assert.ok(NODE_STATES.includes('resumed'));
assert.ok(NODE_STATES.includes('quarantined'));

assertRunTransition('running', 'paused_for_review');
assertRunTransition('paused_for_review', 'running');
assertRunTransition('paused_for_review', 'rejected');
assertRunTransition('failed', 'resumable');
assertRunTransition('resumable', 'resumed');
assertRunTransition('resumed', 'running');

expectThrow(() => assertRunTransition('completed', 'resumable'), 'invalid_run_transition');
expectThrow(() => assertRunTransition('rejected', 'running'), 'invalid_run_transition');
expectThrow(() => assertRunTransition('quarantined', 'running'), 'invalid_run_transition');

assertNodeTransition('running', 'waiting_human_review');
assertNodeTransition('waiting_human_review', 'completed');
assertNodeTransition('waiting_human_review', 'failed');
assertNodeTransition('waiting_human_review', 'quarantined');
assertNodeTransition('failed', 'resumed');
assertNodeTransition('resumed', 'running');

expectThrow(() => assertNodeTransition('completed', 'resumed'), 'invalid_node_transition');
expectThrow(() => assertNodeTransition('quarantined', 'running'), 'invalid_node_transition');

console.log('swarm_state_transitions_v3 test OK');
