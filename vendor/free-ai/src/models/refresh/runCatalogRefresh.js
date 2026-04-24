import { fetchOllamaModelTags } from './providerFetchers/ollamaTags.js';
import { fetchOpenRouterModels } from './providerFetchers/openRouterModels.js';
import { fetchGroqModels } from './providerFetchers/groqModels.js';
import { fetchOpenAiModels } from './providerFetchers/openaiModels.js';
import { staticModelsFromProviderRow } from './providerFetchers/staticKnownModels.js';
import { normalizeProviderCatalog } from './normalizeProviderCatalog.js';
import { computeCatalogDiff } from '../catalogDiff.js';
import { readCatalogSnapshot, writeCatalogSnapshot, writeRefreshStatus } from '../catalogStore.js';

/**
 * @param {{ provider_id: string, status: string, error?: string, models: object[] }} remote
 * @param {{ models: object[] }} fallback
 */
function mergeLiveWithStatic(remote, fallback) {
  if (remote.status === 'OK') return remote;
  return {
    provider_id: remote.provider_id,
    status: 'DEGRADED',
    error: remote.error || 'live_unavailable',
    models: fallback.models || [],
  };
}

/**
 * @param {object} opts
 * @param {object[]} opts.providers from loadConfig().providers
 * @param {string} [opts.ollamaEndpoint]
 * @param {boolean} [opts.skipNetwork] when true, never call provider HTTP (tests)
 * @param {string} [opts.rootOverride] model control plane dir
 */
export async function runCatalogRefresh(opts) {
  const providers = opts.providers || [];
  const skipNetwork = opts.skipNetwork === true;
  const providerStatus = {};
  const allModels = [];

  for (const p of providers) {
    if (!p || !p.id) continue;
    let pack;
    const fallback = staticModelsFromProviderRow(p);

    if (p.id === 'ollama' && !skipNetwork) {
      const base = opts.ollamaEndpoint || process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434';
      const remote = await fetchOllamaModelTags(base);
      pack = mergeLiveWithStatic(remote, fallback);
    } else if (p.id === 'openrouter' && !skipNetwork) {
      const remote = await fetchOpenRouterModels(process.env.OPENROUTER_API_KEY);
      pack = mergeLiveWithStatic(remote, fallback);
    } else if (p.id === 'groq' && !skipNetwork) {
      const remote = await fetchGroqModels(process.env.GROQ_API_KEY);
      pack = mergeLiveWithStatic(remote, fallback);
    } else if (p.id === 'openai' && !skipNetwork) {
      const remote = await fetchOpenAiModels(process.env.OPENAI_API_KEY);
      pack = mergeLiveWithStatic(remote, fallback);
    } else {
      pack = fallback;
    }

    providerStatus[p.id] = { status: pack.status, error: pack.error || null, count: (pack.models || []).length };
    const normalized = normalizeProviderCatalog(p.id, pack.models || []);
    allModels.push(...normalized);
  }

  const overall =
    Object.values(providerStatus).some((s) => s.status === 'DEGRADED') ? 'DEGRADED' : 'OK';

  const snapshot = {
    overall_status: overall,
    generated_at: new Date().toISOString(),
    models: allModels,
  };

  const previous = readCatalogSnapshot(opts.rootOverride);
  const diff = computeCatalogDiff(previous, snapshot);

  writeCatalogSnapshot(snapshot, opts.rootOverride);
  writeRefreshStatus({ provider_status: providerStatus, notes: skipNetwork ? 'network_skipped' : null }, opts.rootOverride);

  return { snapshot, diff, provider_status: providerStatus };
}
