#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { loadConfig } from '../src/config.js';
import { ProviderRegistry } from '../src/providers/registry.js';
import { recordProviderCapability } from '../src/providers/healthMatrix.js';
import { recordUsage } from '../src/providers/budgetGuardian.js';

const cfg = await loadConfig();
const registry = new ProviderRegistry(cfg);
const outDir = path.join(process.cwd(), 'evidence', 'providers');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const report = { generated_at: new Date().toISOString(), probes: [] };

for (const provider of registry.providers) {
  const adapter = registry.adapters.get(provider.id);
  if (!adapter) continue;
  const start = Date.now();
  let probe;
  try {
    const res = await adapter.call(provider.pinnedModel, 'Reply with a short JSON object: {"ok":true}', { response_format: { type: 'json_object' } }, { timeout: 4000 });
    const latency = Date.now() - start;
    if (res.ok) {
      recordProviderCapability(provider.id, 'plain_chat', { ok: true, latency_ms: latency });
      recordProviderCapability(provider.id, 'structured_output', { ok: true, latency_ms: latency });
      recordUsage(provider.id, { requests: 1, tokens: res?.usage?.total_tokens || 0, status: res.http_status || 200, latency });
      probe = { provider_id: provider.id, model_id: provider.pinnedModel, ok: true, latency_ms: latency, supports_plain_chat: true, supports_structured_output: true, supports_streaming: !!provider.supportsStreaming };
    } else {
      recordProviderCapability(provider.id, 'plain_chat', { ok: false, latency_ms: latency, failure_class: res.error_class || 'unknown_error' });
      recordProviderCapability(provider.id, 'structured_output', { ok: false, latency_ms: latency, failure_class: res.error_class || 'unknown_error' });
      recordUsage(provider.id, { requests: 1, tokens: 0, status: res.http_status || 500, latency, failure_class: res.error_class || 'unknown_error' });
      probe = { provider_id: provider.id, model_id: provider.pinnedModel, ok: false, failure_class: res.error_class || 'unknown_error', latency_ms: latency, supports_plain_chat: false, supports_structured_output: false, supports_streaming: !!provider.supportsStreaming };
    }
  } catch (e) {
    const latency = Date.now() - start;
    recordProviderCapability(provider.id, 'plain_chat', { ok: false, latency_ms: latency, failure_class: 'unknown_error' });
    probe = { provider_id: provider.id, model_id: provider.pinnedModel, ok: false, failure_class: 'unknown_error', latency_ms: latency, error: e.message };
  }
  report.probes.push(probe);
}

const file = path.join(outDir, `probe-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 2));
console.log('wrote', file);
