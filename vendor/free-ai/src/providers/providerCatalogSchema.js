/**
 * Declarative schema helpers for the provider discovery registry (metadata only).
 * Runtime adapter wiring remains in ProviderRegistry.
 */

/** @typedef {'https_json'|'local_http'|'grpc'|'unknown'} TransportKind */
/** @typedef {'vendor_openapi'|'local_tags'|'static_pins'|'unknown'} CatalogSourceKind */

export const ADAPTER_KINDS = [
  'openrouter_proxy',
  'openai_compatible',
  'anthropic_compatible',
  'google_gemini',
  'groq_openai',
  'huggingface_router',
  'fireworks_openai',
  'ollama_local',
  'unknown',
];

/**
 * @param {object} r
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateDiscoveryRecord(r) {
  const errors = [];
  if (!r || typeof r !== 'object') errors.push('record_not_object');
  if (!r.provider_id || typeof r.provider_id !== 'string') errors.push('missing_provider_id');
  if (!r.display_name || typeof r.display_name !== 'string') errors.push('missing_display_name');
  if (!r.adapter_kind || typeof r.adapter_kind !== 'string') errors.push('missing_adapter_kind');
  if (!r.transport_kind || typeof r.transport_kind !== 'string') errors.push('missing_transport_kind');
  if (!r.catalog_source_kind || typeof r.catalog_source_kind !== 'string') errors.push('missing_catalog_source_kind');
  return { ok: errors.length === 0, errors };
}
