import { runMetacognition } from '../src/metacog/index.js';

function testMetacog(){
  const r = runMetacognition({ prompt: 'Design a scalable API for millions of users', intent: { raw:'Design an API', intent_family:'compose' }, mode: 'M0' });
  console.assert(r.ok && r.metacog.strategy_type === 'synthesize', 'metacog plan type');
  console.log('metacog test OK', r.metacog.strategy_type, r.metacog.confidence);
}

testMetacog();
