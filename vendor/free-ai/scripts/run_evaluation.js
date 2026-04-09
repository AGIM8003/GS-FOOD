import { Router } from '../src/server/router.js';
import { loadConfig } from '../src/config.js';
import fs from 'fs/promises';
import { join } from 'path';

async function run(){
  const cfg = await loadConfig();
  const router = new Router(cfg);
  const prompts = [
    'Summarize the latest best practices for prompt engineering in a paragraph.',
    'List steps to debug a failing Node.js service that crashes on startup.',
    'Explain how to design a scalable REST API with pagination and caching.'
  ];
  const outDir = join(process.cwd(),'evidence','eval');
  await fs.mkdir(outDir,{ recursive: true });
  const results = [];
  for (let i=0;i<prompts.length;i++){
    const p = prompts[i];
    try{
      const r = await router.handleRequest({ prompt: p });
      const path = join(outDir, `eval-${Date.now()}-${i}.json`);
      await fs.writeFile(path, JSON.stringify({ prompt: p, result: r }, null, 2),'utf8');
      results.push({ i, ok: true, path });
      console.log('eval', i, 'wrote', path);
    }catch(e){ results.push({ i, ok:false, err: e.message }); }
  }
  const summary = join(outDir, `summary-${Date.now()}.json`);
  await fs.writeFile(summary, JSON.stringify({ ts: new Date().toISOString(), results }, null, 2),'utf8');
  console.log('evaluation complete, summary=', summary);
}

if (process.argv[1].endsWith('run_evaluation.js')) run().catch(e=>{ console.error(e); process.exit(2); });
