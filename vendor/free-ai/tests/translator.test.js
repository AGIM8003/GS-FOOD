import { translateIntent } from '../src/cognitive/translator.js';

async function run(){
  const t = await translateIntent('Please summarize the following paper ASAP.');
  console.log('translator.output.keys=', Object.keys(t));
  console.log('intent_family=', t.intent_family, 'tone=', t.tone, 'urgency=', t.urgency);
  if (!t.intent_family) { console.error('missing intent_family'); process.exit(2); }
  console.log('translator.test OK');
}

run().catch(e=>{ console.error(e); process.exit(3); });
