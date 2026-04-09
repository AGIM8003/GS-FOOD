export class GroqAdapter {
  constructor(providerDef) { this.provider = providerDef; }

  async call(modelId, compiledPrompt, ctx, opts = { timeout: 15000 }) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return this._makeError('auth_error', 'missing_api_key', null);
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const body = { model: modelId, messages: [{ role: 'user', content: compiledPrompt }] };
    if (ctx?.response_format) body.response_format = ctx.response_format;
    try {
      const resp = await _fetchWithTimeout(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, opts.timeout);
      const status = resp.status;
      if (!resp.ok) return this._makeError(_classify(status), 'http_error', status);
      const j = await resp.json();
      const text = j?.choices?.[0]?.message?.content || JSON.stringify(j);
      return { ok: true, text, model_id: modelId, provider_id: 'groq', http_status: status, finish_reason: j?.choices?.[0]?.finish_reason || null, usage: j?.usage || null, raw_error: null, latency_ms: 0 };
    } catch (e) {
      return this._makeError(e.name === 'AbortError' ? 'timeout' : 'unknown_error', e.message, null);
    }
  }

  _makeError(classification, msg, status) { return { ok: false, error_class: classification, raw_error: msg, http_status: status || null }; }
}

async function _fetchWithTimeout(url, init, timeout) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const resp = await globalThis.fetch(url, { ...init, signal: controller.signal });
  clearTimeout(id);
  return resp;
}

function _classify(status) {
  if (!status) return 'unknown_error';
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 404) return 'model_not_found';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'upstream_error';
  return 'unknown_error';
}
