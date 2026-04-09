import { translateIntent } from '../src/cognitive/translator.js';
import { buildContext } from '../src/cognitive/contextEngine.js';

async function run(){
  const tr = await translateIntent('Fix the failing CI job and re-run tests.');
  const ctx = await buildContext({ translatorOutput: tr, memoryHits: [] });
  console.log('context.keys=', Object.keys(ctx));
  console.log('intent_family=', ctx.intent_family, 'domain=', ctx.domain, 'continuity=', ctx.continuity_score);
  if (!ctx.context_id) { console.error('missing context_id'); process.exit(2); }
  console.log('context.test OK');
}

run().catch(e=>{ console.error(e); process.exit(3); });
