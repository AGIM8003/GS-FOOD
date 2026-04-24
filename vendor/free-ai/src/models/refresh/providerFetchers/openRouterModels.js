/**
 * Live OpenRouter model list (OpenAI-compatible /v1/models).
 * Optional `OPENROUTER_API_KEY` improves reliability; public listing may still work without a key.
 * @param {string} [apiKey] from env OPENROUTER_API_KEY
 */
export async function fetchOpenRouterModels(apiKey) {
  const url = 'https://openrouter.ai/api/v1/models';
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    /** @type {Record<string, string>} */
    const headers = { Accept: 'application/json' };
    const key = String(apiKey || '').trim();
    if (key) headers.Authorization = `Bearer ${key}`;
    const r = await fetch(url, { signal: ac.signal, headers });
    clearTimeout(t);
    if (!r.ok) {
      return { provider_id: 'openrouter', status: 'DEGRADED', error: `http_${r.status}`, models: [] };
    }
    const j = await r.json();
    const data = Array.isArray(j.data) ? j.data : Array.isArray(j.models) ? j.models : [];
    const models = data
      .map((m) => {
        const id = m && (m.id || m.name);
        if (!id) return null;
        const sid = String(id).toLowerCase();
        const likelyFree = sid.includes(':free') || sid.includes('/free') || sid.includes('free');
        const isPreview = sid.includes('preview') || sid.includes('beta');
        return {
          model_id: String(id),
          canonical_name: String(id),
          release_channel: 'remote',
          status: isPreview ? 'preview' : 'stable',
          free_tier_eligible: likelyFree ? true : null,
        };
      })
      .filter(Boolean);
    return { provider_id: 'openrouter', status: 'OK', models };
  } catch (e) {
    return { provider_id: 'openrouter', status: 'DEGRADED', error: e.message || 'fetch_failed', models: [] };
  }
}
