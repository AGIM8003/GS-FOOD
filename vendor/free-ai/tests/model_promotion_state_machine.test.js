import assert from 'assert';
import { canTransitionPromotion } from '../src/routing/promotionStateMachine.js';

assert.strictEqual(canTransitionPromotion('discovered', 'promoted').ok, false);
assert.strictEqual(canTransitionPromotion('discovered', 'normalized').ok, true);
assert.strictEqual(canTransitionPromotion('discovered', 'candidate').ok, false);
assert.strictEqual(canTransitionPromotion('canary', 'promoted', { evidence_ok: true }).ok, true);
assert.strictEqual(canTransitionPromotion('canary', 'promoted', {}).ok, false);
assert.strictEqual(canTransitionPromotion('promoted', 'rolled_back').ok, true);

console.log('model_promotion_state_machine test OK');
