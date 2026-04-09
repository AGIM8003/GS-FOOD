import { ProviderRegistry } from '../src/providers/registry.js';
import { clearCooldown } from '../src/providers/cooldownManager.js';

const cfg = {
  providers: [
    { id: 'gemini', enabled: true, pinnedModel: 'gemini-2.5-flash', candidates: [], weight: 100, free_tier_class: 'primary_free' },
    { id: 'openrouter', enabled: true, pinnedModel: 'openrouter/free', candidates: [], weight: 90, free_tier_class: 'burst_free' },
  ],
};

clearCooldown('gemini');
clearCooldown('openrouter');

const registry = new ProviderRegistry(cfg);
registry.adapters.set('gemini', {
  async call() { return { ok: false, error_class: 'rate_limited', raw_error: '429', http_status: 429 }; },
});
registry.adapters.set('openrouter', {
  async call(model, prompt) { return { ok: true, text: '{"final_persona_id":"p","skills_used":[],"route_reason":"fallback","confidence":0.7,"notes":"ok"}', http_status: 200, usage: { total_tokens: 10 } }; },
});

const res = await registry.callProviders('hello', { response_contract_id: 'explanation_panel', ladderDecision: { chosen_provider: 'gemini' } }, { timeout: 1000, maxAttemptsPerProvider: 1 });
if (!res.ok || res.receipt.provider_id !== 'openrouter') {
  console.error('expected failover to openrouter', JSON.stringify(res));
  process.exit(2);
}
console.log('provider_failover test OK');
