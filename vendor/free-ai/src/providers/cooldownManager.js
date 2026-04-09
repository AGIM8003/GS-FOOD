import fs from 'fs';
import path from 'path';

const STORE = path.join(process.cwd(), 'data', 'provider_cooldowns.json');

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

export function setCooldown(providerId, ms, reason = 'unspecified') {
  const state = readStore();
  state[providerId] = {
    until: Date.now() + ms,
    reason,
    updated_at: new Date().toISOString(),
  };
  writeStore(state);
  return state[providerId];
}

export function getCooldown(providerId) {
  const state = readStore();
  return state[providerId] || null;
}

export function clearCooldown(providerId) {
  const state = readStore();
  delete state[providerId];
  writeStore(state);
}

export function listCooldowns() {
  return readStore();
}
