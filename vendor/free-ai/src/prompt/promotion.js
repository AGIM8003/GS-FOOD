import fs from 'fs';
import path from 'path';

const STORE = path.join(process.cwd(), 'data', 'prompt_registry.json');
const EVIDENCE_DIR = path.join(process.cwd(), 'evidence', 'promotions');

function ensureDirs() {
  const dataDir = path.dirname(STORE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(EVIDENCE_DIR)) fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

function readStore() {
  try {
    if (!fs.existsSync(STORE)) return { schema_version: 'promptRegistry.v1', families: {} };
    return JSON.parse(fs.readFileSync(STORE, 'utf8'));
  } catch {
    return { schema_version: 'promptRegistry.v1', families: {} };
  }
}

function writeStore(state) {
  ensureDirs();
  fs.writeFileSync(STORE, JSON.stringify(state, null, 2));
}

export function getPromptFamilyState(familyId) {
  const state = readStore();
  return state.families[familyId] || { active_variant: null, candidates: {}, rollback_history: [] };
}

export function getActiveVariant(familyId, fallbackVariant = null) {
  const state = getPromptFamilyState(familyId);
  return state.active_variant || fallbackVariant;
}

export function registerCandidate({ familyId, variantId, metrics = {}, notes = '' }) {
  const state = readStore();
  state.families[familyId] = state.families[familyId] || { active_variant: null, candidates: {}, rollback_history: [] };
  state.families[familyId].candidates[variantId] = {
    metrics,
    notes,
    registered_at: new Date().toISOString(),
  };
  writeStore(state);
  return state.families[familyId].candidates[variantId];
}

export function promoteVariant({ familyId, variantId, baselineMetrics = {}, candidateMetrics = {}, reason = 'manual' }) {
  ensureDirs();
  const state = readStore();
  state.families[familyId] = state.families[familyId] || { active_variant: null, candidates: {}, rollback_history: [] };
  const previous = state.families[familyId].active_variant || null;
  state.families[familyId].active_variant = variantId;
  const receipt = {
    type: 'prompt_promotion',
    family_id: familyId,
    from_variant: previous,
    to_variant: variantId,
    baseline_metrics: baselineMetrics,
    candidate_metrics: candidateMetrics,
    reason,
    promoted_at: new Date().toISOString(),
  };
  writeStore(state);
  fs.writeFileSync(path.join(EVIDENCE_DIR, `promotion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`), JSON.stringify(receipt, null, 2));
  return receipt;
}

export function rollbackVariant({ familyId, rollbackTo = null, reason = 'manual' }) {
  ensureDirs();
  const state = readStore();
  state.families[familyId] = state.families[familyId] || { active_variant: null, candidates: {}, rollback_history: [] };
  const from = state.families[familyId].active_variant || null;
  state.families[familyId].active_variant = rollbackTo;
  const receipt = {
    type: 'prompt_rollback',
    family_id: familyId,
    from_variant: from,
    to_variant: rollbackTo,
    reason,
    rolled_back_at: new Date().toISOString(),
  };
  state.families[familyId].rollback_history.push(receipt);
  writeStore(state);
  fs.writeFileSync(path.join(EVIDENCE_DIR, `rollback-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`), JSON.stringify(receipt, null, 2));
  return receipt;
}

export function listPromotionReceipts(limit = 30) {
  ensureDirs();
  return fs.readdirSync(EVIDENCE_DIR).filter((f) => f.endsWith('.json')).sort().reverse().slice(0, limit);
}
