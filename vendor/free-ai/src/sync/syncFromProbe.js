import fs from 'fs/promises';
import { join } from 'path';

async function main(){
  const outdir = join(process.cwd(), 'out');
  try {
    const files = await fs.readdir(outdir);
    const probe = files.filter(f=> f.startsWith('vendor-free-snapshot-')).sort().pop();
    if (!probe) { console.log('no probe artifact found in out/'); process.exit(0); }
    const text = await fs.readFile(join(outdir, probe), 'utf8');
    let j;
    try { j = JSON.parse(text); } catch(e) { console.error('probe artifact malformed'); process.exit(1); }
    const openrouter = j.find(x=> x.vendor==='openrouter');
    if (openrouter && openrouter.detected_free_models && openrouter.detected_free_models.length) {
      const dryRun = process.argv.includes('--dry-run');
      const verbose = process.argv.includes('--verbose');
      const ppath = join(process.cwd(),'providers.json');
      const ptext = await fs.readFile(ppath,'utf8');
      const prov = JSON.parse(ptext);
      // backup
      const backupPath = join(process.cwd(),'providers.history.json');
      const history = { timestamp: new Date().toISOString(), probeFile: probe, previous: prov };
      if (!dryRun) await fs.appendFile(backupPath, JSON.stringify(history, null, 2) + '\n');
      const candidate = openrouter.detected_free_models[0];
      // write structured sync-report
      const report = { timestamp: new Date().toISOString(), provider: 'openrouter', promoted: candidate, previous: prov.providers.find(p=>p.id==='openrouter')?.pinnedModel || null };
      await fs.writeFile(join(process.cwd(),'out', `sync-report-${Date.now()}.json`), JSON.stringify(report,null,2),'utf8').catch(()=>{});
      if (prov.providers.find(p=>p.id==='openrouter' && p.pinnedModel === candidate)) {
        if (verbose) console.log('candidate matches current pinned model; no action');
        console.log('no update required');
        process.exit(0);
      }
      // safe promote
      const newProv = prov;
      newProv.providers = newProv.providers.map(p=> p.id==='openrouter' ? {...p, pinnedModel: candidate, lastChecked: new Date().toISOString(), candidates: openrouter.detected_free_models } : p);
      if (dryRun) { console.log('dry-run: would update pinnedModel to', candidate); process.exit(0); }
      await fs.writeFile(ppath, JSON.stringify(newProv, null, 2),'utf8');
      console.log(JSON.stringify({ result:'promoted', provider:'openrouter', candidate, probe: probe }));
      process.exit(2);
    }
    console.log('no update required');
  } catch (e) { console.error('sync error', e); process.exit(1); }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
