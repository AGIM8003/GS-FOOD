import { Router } from '../src/server/router.js';
import { loadConfig } from '../src/config.js';

async function run(){
  const cfg = await loadConfig();
  const router = new Router(cfg);
  const prompt = 'Research: summarize recent best practices for prompt engineering';
  const resp = await router.handleRequest({ prompt });
  console.log('fusion test response status=', resp.status);
  if (resp && resp.receipt && resp.receipt.skills_loaded) {
    console.log('skills_loaded count=', resp.receipt.skills_loaded.length);
    process.exit(0);
  }
  console.error('fusion test failed: no receipt or skills_loaded');
  process.exit(2);
}

run().catch(e=>{ console.error(e); process.exit(2); });
