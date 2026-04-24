/**
 * Live Groq model list (OpenAI-compatible /v1/models). Requires `GROQ_API_KEY`.
 * @param {string} [apiKey] from env GROQ_API_KEY
 */
export async function fetchGroqModels(apiKey) {
  const url = 'https://api.groq.com/openai/v1/models';
  const key = String(apiKey || '').trim();
  if (!key) {
    return { provider_id: 'groq', status: 'DEGRADED', error: 'missing_api_key', models: [] };
  }
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const r = await fetch(url, {
      signal: ac.signal,
      headers: { Accept: 'application/json', Authorization: `Bearer ${key}` },
    });
    clearTimeout(t);
    if (!r.ok) {
      return { provider_id: 'groq', status: 'DEGRADED', error: `http_${r.status}`, models: [] };
    }
    const j = await r.json();
    const data = Array.isArray(j.data) ? j.data : [];
    const models = data
      .map((m) => {
        const id = m && (m.id || m.name);
        if (!id) return null;
        const sid = String(id).toLowerCase();
        const likelyFree = sid.includes('instant') || sid.includes('8b') || sid.includes('mini');
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
    return { provider_id: 'groq', status: 'OK', models };
  } catch (e) {
    return { provider_id: 'groq', status: 'DEGRADED', error: e.message || 'fetch_failed', models: [] };
  }
}
