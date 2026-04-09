export class GeminiAdapter {
  constructor(providerDef){ this.provider = providerDef; }

  async call(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    // Gemini often requires special endpoints; we emulate a normal POST to a hypothetical endpoint.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return this._makeError('auth_error','missing_api_key',null);
    const url = `https://api.google.com/gemini/v1/complete`;
    try{
      const body = { model:modelId, input:compiledPrompt };
      if (ctx?.response_format?.response_mime_type) body.response_mime_type = ctx.response_format.response_mime_type;
      if (ctx?.response_format?.response_schema) body.response_schema = ctx.response_format.response_schema;
      const resp = await _fetchWithTimeout(url, { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'}, body: JSON.stringify(body) }, opts.timeout);
      const status = resp.status;
      if (!resp.ok) return this._makeError(_classify(status),'http_error',status);
      const j = await resp.json();
      const text = j?.candidates?.[0]?.content || JSON.stringify(j);
      return { ok:true, text, model_id: modelId, provider_id: 'gemini', http_status: status, finish_reason: null, usage: j?.usage || null, raw_error: null, latency_ms:0 };
    } catch(e){ return this._makeError(e.name==='AbortError'?'timeout':'unknown_error', e.message, null); }
  }

  async callStream(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    const r = await this.call(modelId, compiledPrompt, ctx, opts);
    if (r.ok) { async function* gen(){ yield {chunk: r.text, is_final: true}; } return { stream: gen() }; }
    throw new Error(r.raw_error || 'stream_error');
  }

  _makeError(classification,msg,status){ return { ok:false, error_class: classification, raw_error: msg, http_status: status || null }; }
}

async function _fetchWithTimeout(url, init, timeout){
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  const _fetch = globalThis.fetch;
  if (typeof _fetch !== 'function') throw new Error('fetch not available');
  const resp = await _fetch(url, {...init, signal: controller.signal});
  clearTimeout(id);
  return resp;
}

function _classify(status){
  if (!status) return 'unknown_error';
  if (status===401) return 'auth_error';
  if (status===429) return 'rate_limited';
  if (status>=500) return 'upstream_error';
  if (status===404) return 'model_not_found';
  return 'upstream_error';
}
