import { translateIntent } from '../src/cognitive/translator.js';
import { buildContext } from '../src/cognitive/contextEngine.js';
import { runReasoning } from '../src/cognitive/reasoning.js';

async function run(){
  const tr = await translateIntent('Research recent papers on LLM safety.');
  const ctx = await buildContext({ translatorOutput: tr, memoryHits: [] });
  const r = await runReasoning({ translatorOutput: tr, contextSnapshot: ctx, memoryHits: [] });
  console.log('reasoning.keys=', Object.keys(r));
  console.log('strategy=', r.strategy_type, 'persona_recommendation=', r.persona_recommendation);
  if (!r.strategy_type) { console.error('missing strategy_type'); process.exit(2); }
  console.log('reasoning.test OK');
}

run().catch(e=>{ console.error(e); process.exit(3); });
