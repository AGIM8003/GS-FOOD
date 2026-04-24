import assert from 'assert';
import { fetchOpenRouterModels } from '../src/models/refresh/providerFetchers/openRouterModels.js';
import { fetchGroqModels } from '../src/models/refresh/providerFetchers/groqModels.js';
import {
  fetchOpenAiModels,
  modalityFlagsForOpenAiModelId,
} from '../src/models/refresh/providerFetchers/openaiModels.js';

const saved = global.fetch;

try {
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { data: [{ id: 'contract/test-model' }] };
    },
  });
  const or = await fetchOpenRouterModels('');
  assert.strictEqual(or.status, 'OK');
  assert.strictEqual(or.models.length, 1);
  assert.strictEqual(or.models[0].model_id, 'contract/test-model');
} finally {
  global.fetch = saved;
}

const g = await fetchGroqModels('');
assert.strictEqual(g.status, 'DEGRADED');
assert.ok(g.error);

try {
  global.fetch = async () => ({
    ok: true,
    async json() {
      return { data: [{ id: 'text-embedding-3-small' }, { id: 'gpt-4o' }] };
    },
  });
  const oa = await fetchOpenAiModels('sk-test');
  assert.strictEqual(oa.status, 'OK');
  assert.strictEqual(oa.models.length, 2);
  const emb = oa.models.find((m) => m.model_id === 'text-embedding-3-small');
  assert.ok(emb?.modality_flags?.embeddings === true);
} finally {
  global.fetch = saved;
}

const mf = modalityFlagsForOpenAiModelId('dall-e-3');
assert.strictEqual(mf.image_output, true);

console.log('catalog_fetchers_contract test OK');
