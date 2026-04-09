import fs from 'fs';
import path from 'path';

const STORE = path.join(process.cwd(), 'data', 'provider_health_matrix.json');
const CAPABILITIES = ['plain_chat', 'structured_output', 'tool_use', 'streaming', 'long_context', 'multimodal'];

function ensureDir() {
  const dir = path.dirname(STORE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readStore() {
  try {
    if (!fs.existsSync(STORE)) return {};
    return JSON.parse(fs.readFileSync(STORE, 'utf8'));
  } catch {
    return {};
  }
}

function writeStore(data) {
  ensureDir();
  fs.writeFileSync(STORE, JSON.stringify(data, null, 2));
}

function emptyCapability() {
  return {
    attempts: 0,
    successes: 0,
    failures: 0,
    avg_latency_ms: 0,
    last_failure_class: null,
    last_checked: null,
    healthy: true,
  };
}

export function getProviderCapability(providerId, capability = 'plain_chat') {
  const state = readStore();
  return state[providerId]?.[capability] || emptyCapability();
}

export function recordProviderCapability(providerId, capability = 'plain_chat', { ok, latency_ms = 0, failure_class = null } = {}) {
  const state = readStore();
  state[providerId] = state[providerId] || {};
  state[providerId][capability] = state[providerId][capability] || emptyCapability();
  const current = state[providerId][capability];
  current.attempts += 1;
  current.last_checked = new Date().toISOString();
  current.avg_latency_ms = current.avg_latency_ms === 0 ? latency_ms : Math.round((current.avg_latency_ms + latency_ms) / 2);
  if (ok) {
    current.successes += 1;
    current.healthy = true;
    current.last_failure_class = null;
  } else {
    current.failures += 1;
    current.last_failure_class = failure_class;
    current.healthy = failure_class === 'auth_error' ? false : current.failures < Math.max(3, current.successes + 2);
  }
  writeStore(state);
  return current;
}

export function summarizeHealthMatrix() {
  const state = readStore();
  const out = {};
  for (const [providerId, caps] of Object.entries(state)) {
    out[providerId] = {};
    for (const capability of CAPABILITIES) {
      out[providerId][capability] = caps[capability] || emptyCapability();
    }
  }
  return out;
}
