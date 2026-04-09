import fs from 'fs';
import path from 'path';

const STORE = path.join(process.cwd(), 'data', 'provider_governance.json');

function ensureDir() {
  const dir = path.dirname(STORE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export function readGovernanceState() {
  return readJson(STORE, { generated_at: null, providers: {} });
}

export function writeGovernanceState(state) {
  ensureDir();
  fs.writeFileSync(STORE, JSON.stringify(state, null, 2));
}

export function getProviderGovernance(providerId) {
  const state = readGovernanceState();
  return state.providers?.[providerId] || { status: 'neutral', route_penalty: 0, route_bonus: 0, last_known_good_model: null };
}

export function runGovernanceCycle({ providers = [], latestProbe = null, quotaSnapshots = {}, healthMatrix = {} } = {}) {
  const next = { generated_at: new Date().toISOString(), providers: {} };
  for (const provider of providers) {
    const probe = latestProbe?.probes?.find((p) => p.provider_id === provider.id) || null;
    const quota = quotaSnapshots[provider.id] || {};
    const plainChat = healthMatrix[provider.id]?.plain_chat || null;
    let route_penalty = 0;
    let route_bonus = 0;
    let status = 'neutral';
    let reason = [];

    if (probe && probe.ok === false) {
      route_penalty -= 15;
      status = 'demoted';
      reason.push(`probe:${probe.failure_class || 'failed'}`);
    }
    if (quota.free_reliability_score !== undefined) {
      if (quota.free_reliability_score < 0.45) {
        route_penalty -= 12;
        status = 'demoted';
        reason.push('low_free_reliability');
      } else if (quota.free_reliability_score > 0.85) {
        route_bonus += 8;
        if (status === 'neutral') status = 'promoted';
        reason.push('high_free_reliability');
      }
    }
    if (plainChat && plainChat.healthy === false) {
      route_penalty -= 10;
      status = 'demoted';
      reason.push(`health:${plainChat.last_failure_class || 'unhealthy'}`);
    }

    next.providers[provider.id] = {
      provider_id: provider.id,
      status,
      route_penalty,
      route_bonus,
      reason,
      last_known_good_model: probe?.ok ? probe.model_id : null,
      updated_at: new Date().toISOString(),
    };
  }
  writeGovernanceState(next);
  return next;
}
