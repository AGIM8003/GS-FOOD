import fs from 'fs/promises';
import { join } from 'path';
import { listPersonas, loadPersona, selectPersona } from '../src/persona/registry.js';

async function run(){
  const files = await listPersonas();
  console.log('persona files count=', files.length);
  if (files.length < 20) { console.error('Expected >=20 personas bundled'); process.exit(2); }
  const p = await loadPersona('technical_architect');
  if (!p) { console.error('technical_architect missing'); process.exit(2); }
  // request a missing persona to trigger acquisition queue
  const res = await selectPersona({ intent: { intent_family: 'compose' }, memoryHits: [], override: 'persona_not_exists_x', tone: null, urgency: 0 });
  console.log('override_missing result acquisition_state=', res.acquisition_state || null);
  if (res.acquisition_state !== 'queued_for_acquisition') { console.error('expected queued_for_acquisition'); process.exit(2); }
  console.log('persona_catalog.test OK');
}

run().catch(e=>{ console.error(e); process.exit(2); });
