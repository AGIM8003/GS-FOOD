import fs from 'fs/promises';
import { join } from 'path';

const QDIR = join(process.cwd(),'evidence','imports','quarantine');
const OUT = join(process.cwd(),'evidence','imports');

async function listQuarantined(){
  try{
    const files = await fs.readdir(QDIR);
    const skills = [];
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const txt = await fs.readFile(join(QDIR,f),'utf8');
      const j = JSON.parse(txt);
      skills.push({ id: j.id || j.skill_id || f.replace('.json',''), file: f, summary: j.purpose || j.name || '' });
    }
    return skills;
  }catch(e){ return []; }
}

async function writeReport(list){
  await fs.mkdir(OUT,{ recursive: true });
  const path = join(OUT, `curation-report-${Date.now()}.json`);
  await fs.writeFile(path, JSON.stringify({ ts: new Date().toISOString(), count: list.length, items: list }, null, 2),'utf8');
  return path;
}

async function run(){
  const list = await listQuarantined();
  console.log('quarantined count=', list.length);
  for (const s of list) console.log('-', s.id, s.summary);
  const rp = await writeReport(list);
  console.log('wrote curation report =>', rp);
}

if (import.meta.url === `file://${process.cwd().replace(/\\/g,'/')}/scripts/curate_quarantine.js` || process.argv[1].endsWith('curate_quarantine.js')) run().catch(e=>{ console.error(e); process.exit(2); });
