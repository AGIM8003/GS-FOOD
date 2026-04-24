/**
 * Best-effort Ollama tag listing. Fail-closed: errors become DEGRADED with empty models.
 * @param {string} baseUrl from env or providers.json
 */
export async function fetchOllamaModelTags(baseUrl) {
  const root = String(baseUrl || 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 4000);
    const r = await fetch(`${root}/api/tags`, { signal: ac.signal });
    clearTimeout(t);
    if (!r.ok) return { provider_id: 'ollama', status: 'DEGRADED', error: `http_${r.status}`, models: [] };
    const j = await r.json();
    const models = (j.models || []).map((m) => ({
      model_id: m.name,
      canonical_name: m.name,
      release_channel: 'local',
      status: 'stable',
    }));
    return { provider_id: 'ollama', status: 'OK', models };
  } catch (e) {
    return { provider_id: 'ollama', status: 'DEGRADED', error: e.message || 'fetch_failed', models: [] };
  }
}
