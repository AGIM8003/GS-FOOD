import { OpenAIAdapter } from '../src/providers/openaiAdapter.js';

async function testOpenAIAdapterAuthMissing(){
  const a = new OpenAIAdapter({id:'openai'});
  const r = await a.call('gpt-4', 'hello', {});
  console.assert(r.ok===false && r.error_class==='auth_error', 'OpenAI adapter should return auth_error when key missing');
  console.log('provider_normalization.test: openai auth missing => OK');
}

await testOpenAIAdapterAuthMissing();
