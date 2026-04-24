import { validateDiscoveryRecord } from './providerCatalogSchema.js';

function adapterKindForProvider(id) {
  const m = {
    openrouter: 'openrouter_proxy',
    openai: 'openai_compatible',
    anthropic: 'anthropic_compatible',
    gemini: 'google_gemini',
    groq: 'groq_openai',
    huggingface: 'huggingface_router',
    fireworks: 'fireworks_openai',
    ollama: 'ollama_local',
  };
  return m[id] || 'unknown';
}

function transportForProvider(id) {
  if (id === 'ollama') return 'local_http';
  return 'https_json';
}

function catalogSourceForProvider(id) {
  if (id === 'ollama') return 'local_tags';
  if (id === 'openrouter') return 'vendor_openapi';
  return 'static_pins';
}

/**
 * Build immutable discovery rows from providers.json entries (no network).
 * @param {Array<object>} providers
 * @returns {object[]}
 */
export function buildProviderDiscoveryRegistry(providers) {
  const rows = (providers || []).map((p) => {
    const r = {
      provider_id: p.id,
      display_name: p.displayName || p.id,
      adapter_kind: adapterKindForProvider(p.id),
      transport_kind: transportForProvider(p.id),
      catalog_source_kind: catalogSourceForProvider(p.id),
      auth_requirements: p.envKey ? { env_keys: [p.envKey] } : {},
      enabled: p.enabled !== false,
      default_timeout_ms: 15000,
      free_tier_possible: !!p.free_tier_eligible,
      supports_auto_catalog_refresh: p.id === 'ollama' || p.id === 'openrouter',
      supports_latest_alias: p.id === 'gemini' || p.id === 'openrouter',
      supports_capability_introspection: false,
      notes: p.tier ? `tier=${p.tier}` : null,
    };
    const v = validateDiscoveryRecord(r);
    if (!v.ok) throw new Error(`discovery_record_invalid:${v.errors.join(',')}`);
    return r;
  });
  return rows;
}
