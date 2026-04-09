export class OllamaAdapter {
  constructor(providerDef){ this.provider = providerDef; }

  async call(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    // Ollama local endpoint default: http://localhost:11434
    const endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    const url = `${endpoint}/api/generate`;
    try{
      const resp = await _fetchWithTimeout(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({model: modelId, prompt: compiledPrompt}) }, opts.timeout);
      const status = resp.status;
      if (!resp.ok) return this._makeError(_classify(status),'http_error',status);
      const j = await resp.json();
      const text = j?.results?.[0]?.text || JSON.stringify(j);
      return { ok:true, text, model_id: modelId, provider_id: 'ollama', http_status: status, finish_reason: null, usage: null, raw_error: null, latency_ms:0 };
    } catch(e){ return this._makeError(e.name==='AbortError'?'timeout':'unknown_error', e.message, null); }
  }

  async callStream(modelId, compiledPrompt, ctx, opts={timeout:15000}){
    // If Ollama supports chunked streaming via SSE, we'd implement it; for now return single chunk.
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
