import fs from 'fs/promises';
import { join } from 'path';

const MEM = join(process.cwd(),'memory','persona_effectiveness.json');
const PDIR = join(process.cwd(),'personas');
const OUT = join(process.cwd(),'evidence','persona');

async function run(){
  try{
    const cur = JSON.parse(await fs.readFile(MEM,'utf8'));
    const files = await fs.readdir(PDIR);
    const tuned = [];
    for (const f of files){
      if (!f.endsWith('.json')) continue;
      let p = null;
      try{ p = JSON.parse(await fs.readFile(join(PDIR,f),'utf8')); }catch(e){ console.warn('skipping malformed persona', f); continue; }
      const eff = cur[p.id] || null;
      if (eff && eff.selection_count > 5){
        p.tuning = p.tuning || {}; p.tuning.last_tuned = new Date().toISOString(); p.tuning.selection_count = eff.selection_count;
        try{ await fs.writeFile(join(PDIR,f), JSON.stringify(p,null,2),'utf8'); }catch(e){ console.warn('write failed for', f); }
        tuned.push({ id: p.id, selection_count: eff.selection_count });
      }
    }
    await fs.mkdir(OUT,{ recursive: true });
    const outPath = join(OUT, `tune-${Date.now()}.json`);
    await fs.writeFile(outPath, JSON.stringify({ ts: new Date().toISOString(), tuned }, null, 2),'utf8');
    console.log('tuned personas:', tuned.length, 'report:', outPath);
  }catch(e){ console.error('tune error', e.message); process.exit(2); }
}

if (process.argv[1].endsWith('tune_personas.js')) run();
