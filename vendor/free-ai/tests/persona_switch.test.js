import { selectPersona } from '../src/persona/registry.js';

async function run(){
  const res = await selectPersona({ intent: { intent_family: 'compose' }, memoryHits: [], override: null, tone: null, urgency: 0 });
  console.log('persona selection result:', res.final_persona_id, 'conf=', res.confidence);
  const res2 = await selectPersona({ intent: { intent_family: 'unknown' }, memoryHits: [], override: 'default' });
  console.log('persona selection override result:', res2.final_persona_id, 'conf=', res2.confidence);
}

run().then(()=>console.log('persona_switch.test OK')).catch(e=>{ console.error(e); process.exit(2); });
