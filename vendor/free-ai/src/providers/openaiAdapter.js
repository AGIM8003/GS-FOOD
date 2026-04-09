export class OpenAIAdapter {
  constructor(providerDef) { this.provider = providerDef; }

  async call(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return this._makeError('auth_error','missing_api_key',null);
    const url = `https://api.openai.com/v1/chat/completions`;
    const body = { model: modelId, messages: [{role:'user', content: compiledPrompt}] };
    if (ctx?.response_format) body.response_format = ctx.response_format;
    return await _fetchWithTimeout(url, { method:'POST', headers:{'Authorization':`Bearer ${apiKey}`,'Content-Type':'application/json'}, body: JSON.stringify(body) }, opts.timeout)
      .then(async resp=>{
        const status = resp.status;
        if (!resp.ok) return this._makeError(_classify(status),'http_error',status);
        const j = await resp.json();
        const text = j?.choices?.[0]?.message?.content || JSON.stringify(j);
        return this._normalizeSuccess(text, modelId, 'openai', status, j?.choices?.[0]?.finish_reason, j?.usage, null);
      })
      .catch(err=> this._makeError(err.name==='AbortError'?'timeout':'unknown_error', err.message, null));
  }

  async callStream(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    // If streaming not supported here, emulate single chunk
    const r = await this.call(modelId, compiledPrompt, ctx, opts);
    if (r.ok) {
      async function* gen(){
        yield { chunk: r.text, is_final: true };
      }
      return { stream: gen() };
    }
    throw new Error(r.raw_error || 'stream_error');
  }

  _normalizeSuccess(text, model_id, provider_id, status, finish_reason, usage, raw){
    return { ok:true, text, model_id, provider_id, http_status: status, finish_reason, usage, raw_error: raw, latency_ms: 0 };
  }
  _makeError(classification, msg, status){ return { ok:false, error_class: classification, raw_error: msg, http_status: status || null }; }
}

async function _fetchWithTimeout(url, init, timeout){
  const controller = new AbortController();
  const id = setTimeout(()=>controller.abort(), timeout);
  const _fetch = globalThis.fetch;
  if (typeof _fetch !== 'function') throw new Error('fetch not available (Node>=18 required)');
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
  if (status===400) return 'bad_request';
  return 'upstream_error';
}
