#!/usr/bin/env node
import { importAll } from '../src/skills/importer.js';
import { runDedupeAudit } from '../src/skills/dedupe_and_audit.js';
import fs from 'fs';
import path from 'path';

async function main(){
  console.log('Running bulk importer...');
  try{
    const res = importAll({ dedupe: true });
    console.log('Importer finished. receipts written to evidence/imports/');
  }catch(e){ console.error('Importer error', e); }

  console.log('Running dedupe and audit...');
  try{
    const r = runDedupeAudit();
    console.log('Dedupe audit complete:', r.summaryPath, 'active:', r.activePath);
    const combined = { summaryPath: r.summaryPath, activePath: r.activePath, timestamp: Date.now() };
    const out = path.join(process.cwd(),'evidence','imports','import-run-'+Date.now()+'.json');
    fs.writeFileSync(out, JSON.stringify(combined, null, 2));
  }catch(e){ console.error('Audit failed', e); process.exit(2); }
}

// run main when executed as script under ESM
main().catch(e=>{ console.error(e); process.exit(2); });
