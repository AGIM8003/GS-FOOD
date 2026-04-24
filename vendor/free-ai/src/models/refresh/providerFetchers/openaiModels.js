/**
 * Live OpenAI model list (OpenAI-compatible /v1/models). Requires `OPENAI_API_KEY`.
 * @param {string} [apiKey] from env OPENAI_API_KEY
 */

/** @param {string} id */
export function modalityFlagsForOpenAiModelId(id) {
  const s = String(id || '').toLowerCase();
  const flags = {
    text: true,
    vision: false,
    embeddings: false,
    image_output: false,
    audio: false,
    tools_json: true,
  };
  if (s.includes('embedding') || s.startsWith('text-embedding')) {
    flags.embeddings = true;
    flags.text = false;
    flags.tools_json = false;
  }
  if (s.includes('dall-e') || s.includes('gpt-image')) {
    flags.image_output = true;
    flags.text = false;
    flags.tools_json = false;
  }
  if (s.includes('tts') || s.includes('whisper') || s.includes('audio')) {
    flags.audio = true;
  }
  if (s.includes('vision') || s.includes('4o') || s.includes('gpt-4-turbo')) {
    flags.vision = true;
  }
  return flags;
}

export async function fetchOpenAiModels(apiKey) {
  const url = 'https://api.openai.com/v1/models';
  const key = String(apiKey || '').trim();
  if (!key) {
    return { provider_id: 'openai', status: 'DEGRADED', error: 'missing_api_key', models: [] };
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
      return { provider_id: 'openai', status: 'DEGRADED', error: `http_${r.status}`, models: [] };
    }
    const j = await r.json();
    const data = Array.isArray(j.data) ? j.data : [];
    const models = data
      .map((m) => {
        const id = m && (m.id || m.name);
        if (!id) return null;
        const sid = String(id).toLowerCase();
        const likelyFree = sid.includes('mini') || sid.includes('nano') || sid.includes('o4-mini');
        const isPreview = sid.includes('preview') || sid.includes('beta');
        return {
          model_id: String(id),
          canonical_name: String(id),
          release_channel: 'remote',
          status: isPreview ? 'preview' : 'stable',
          modality_flags: modalityFlagsForOpenAiModelId(id),
          free_tier_eligible: likelyFree ? true : null,
        };
      })
      .filter(Boolean);
    return { provider_id: 'openai', status: 'OK', models };
  } catch (e) {
    return { provider_id: 'openai', status: 'DEGRADED', error: e.message || 'fetch_failed', models: [] };
  }
}
