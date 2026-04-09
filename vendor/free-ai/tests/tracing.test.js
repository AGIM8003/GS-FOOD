import fs from 'fs';
import path from 'path';
import { Router } from '../src/server/router.js';

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function run(){
  const cfg = { root: process.cwd(), providers: [] };
  const r = new Router(cfg);
  // make a simple call that will fallback to KB (no providers)
  const res = await r.handleRequest({ prompt: 'Summarize the design of a small app' });
  // wait briefly for traces to flush
  await sleep(50);
  const traceDir = path.join(process.cwd(),'evidence','traces');
  if (!fs.existsSync(traceDir)) { console.error('trace dir missing'); process.exit(2); }
  const files = fs.readdirSync(traceDir).filter(f=> f.endsWith('.json'));
  if (files.length === 0) { console.error('no trace files produced'); process.exit(2); }
  console.log('tracing test OK - traces:', files.length);
  process.exit(0);
}

run().catch(e=>{ console.error(e); process.exit(2); });
