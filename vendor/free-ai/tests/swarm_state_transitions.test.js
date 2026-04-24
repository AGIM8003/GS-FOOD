import assert from 'assert';
import { assertRunTransition, assertNodeTransition } from '../src/swarm/transitionReducer.js';

assertRunTransition('created', 'validating');
assertRunTransition('validating', 'admitted');
assertRunTransition('admitted', 'running');
assertRunTransition('running', 'completed');
assertRunTransition('running', 'failed');
assertRunTransition('validating', 'failed');
assertRunTransition('admitted', 'failed');
assertRunTransition('created', 'failed');

assert.throws(() => assertRunTransition('running', 'validating'));
assert.throws(() => assertRunTransition('completed', 'running'));

assertNodeTransition('pending', 'admitted');
assertNodeTransition('admitted', 'running');
assertNodeTransition('running', 'completed');
assertNodeTransition('running', 'failed');
assertNodeTransition('pending', 'skipped');

assert.throws(() => assertNodeTransition('pending', 'completed'));
assert.throws(() => assertNodeTransition('completed', 'running'));

console.log('swarm_state_transitions test OK');
