import { Router } from '../src/server/router.js';

const router = new Router({ root: process.cwd(), providers: [] });
const res = await router.handleRequest({ prompt: 'Create a 3 step plan for testing', preview_only: true, output_contract: 'plan_output' });
if (res.status !== 200 || !res.body?.compiled_prompt || res.body?.output_contract?.id !== 'plan_output') {
  console.error('prompt preview failed');
  process.exit(2);
}
console.log('prompt_preview test OK');
