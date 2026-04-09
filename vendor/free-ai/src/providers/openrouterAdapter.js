export class OpenRouterAdapter {
  constructor(providerDef) {
    this.provider = providerDef;
  }

  async call(modelId, compiledPrompt, ctx, opts={timeout:15000}) {
    // If probe artifact exists, prefer that model id mapping; otherwise best-effort HTTP call to OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY || null;
    if (!apiKey) return { ok:false, error_class:'auth_error', raw_error:'missing_api_key', http_status:null };

    // Use OpenRouter inference endpoint shape if available
    const url = `https://api.openrouter.ai/v1/chat/completions`;
    const body = { model: modelId, messages: [{role:'user', content: compiledPrompt}] };
    if (ctx?.response_format) body.response_format = ctx.response_format;
    const _fetch = globalThis.fetch;
    if (typeof _fetch !== 'function') return { ok:false, error_class:'unknown_error', raw_error:'fetch_not_available', http_status:null };
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), opts.timeout || 15000);
      const resp = await _fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
      clearTimeout(id);
      const status = resp.status;
      if (!resp.ok) return { ok:false, error_class: classify(status), raw_error:'http_error', http_status: status };
      const j = await resp.json();
      const text = j?.choices?.[0]?.message?.content || JSON.stringify(j);
      return { ok:true, text, model_id: modelId, provider_id:'openrouter', http_status: status, finish_reason: j?.choices?.[0]?.finish_reason || null, usage: j?.usage || null, raw_error:null, latency_ms:0 };
    } catch (e) {
      return { ok:false, error_class: e.name === 'AbortError' ? 'timeout' : 'unknown_error', raw_error:e.message, http_status:null };
    }
  }
}

function classify(status){
  if (!status) return 'unknown_error';
  if (status === 401 || status === 403) return 'auth_error';
  if (status === 404) return 'model_not_found';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'upstream_error';
  return 'unknown_error';
}
