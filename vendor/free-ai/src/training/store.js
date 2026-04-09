import fs from 'fs/promises';
import { join } from 'path';

const TRAINING_DIR = join(process.cwd(), 'data', 'training');
const EVIDENCE_DIR = join(process.cwd(), 'evidence', 'training');

export const TRAINING_PATHS = {
  dir: TRAINING_DIR,
  evidenceDir: EVIDENCE_DIR,
  config: join(TRAINING_DIR, 'config.json'),
  observations: join(TRAINING_DIR, 'observations.json'),
  overlays: join(TRAINING_DIR, 'overlays.json'),
  reviewQueue: join(TRAINING_DIR, 'review-queue.json'),
  state: join(TRAINING_DIR, 'state.json'),
  insights: join(TRAINING_DIR, 'insights.json'),
};

const DEFAULT_CONFIG = {
  enabled: true,
  observe_requests: true,
  auto_run_on_request: true,
  auto_run_interval_ms: 5 * 60 * 1000,
  max_observations_retained: 500,
  max_observations_per_cycle: 80,
  min_observations_to_learn: 3,
  environment: 'general',
  environment_tags: ['general'],
  compliance_profile: {
    regulatory_mode: 'baseline',
    sensitive_domains: ['legal', 'medical', 'finance'],
    blocked_domains: [],
    require_guarded_mode_for_sensitive_domains: true,
    web_research_allowed: true,
    overlay_write_mode: 'overlay_only',
    auto_apply_safe_overlays: true,
    auto_promote_persona_files: false,
    auto_promote_skill_files: false,
    require_human_review_for_promotions: true,
  },
  curriculum: {
    focus_on_most_used: true,
    max_domains: 3,
    max_topics: 8,
    max_personas: 5,
    max_skills: 8,
  },
  retention: {
    overlay_max_age_days: 30,
    academy_max_age_days: 45,
    min_success_rate_to_remain_active: 0.45,
    retire_low_confidence_overlays: true,
  },
  review_queue: {
    enabled: true,
    min_observations_for_review: 6,
    min_success_rate_for_review: 0.72,
    max_open_items: 50,
  },
};

const DEFAULT_OVERLAYS = {
  personas: {},
  skills: {},
  academies: {},
  updated_at: null,
  schema_version: 'trainingOverlays.v1',
};

const DEFAULT_STATE = {
  running: false,
  last_run_at: null,
  last_cycle_id: null,
  last_status: 'idle',
  last_control_action: null,
  last_error: null,
  retired_overlay_count: 0,
  schema_version: 'trainingState.v1',
};

const DEFAULT_REVIEW_QUEUE = {
  items: [],
  updated_at: null,
  schema_version: 'trainingReviewQueue.v1',
};

const DEFAULT_INSIGHTS = {
  cycle_id: null,
  generated_at: null,
  status: 'idle',
  summary: null,
  academies: [],
  persona_overlays: [],
  skill_overlays: [],
  acquisition_signals: [],
  schema_version: 'trainingInsights.v1',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(base, patch) {
  if (!isPlainObject(patch)) return clone(base);
  const out = clone(base);
  for (const [key, value] of Object.entries(patch)) {
    if (Array.isArray(value)) {
      out[key] = [...value];
      continue;
    }
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = mergeDeep(out[key], value);
      continue;
    }
    out[key] = value;
  }
  return out;
}

async function ensureDir() {
  await fs.mkdir(TRAINING_DIR, { recursive: true });
  await fs.mkdir(EVIDENCE_DIR, { recursive: true });
}

async function readJson(filePath, fallback) {
  await ensureDir();
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallback, null, 2), 'utf8');
    return clone(fallback);
  }
}

async function writeJson(filePath, value) {
  await ensureDir();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
  return value;
}

export async function loadTrainingConfig() {
  const current = await readJson(TRAINING_PATHS.config, DEFAULT_CONFIG);
  return mergeDeep(DEFAULT_CONFIG, current);
}

export async function saveTrainingConfig(config) {
  const merged = mergeDeep(DEFAULT_CONFIG, config || {});
  return writeJson(TRAINING_PATHS.config, merged);
}

export async function updateTrainingConfig(patch) {
  const current = await loadTrainingConfig();
  const next = mergeDeep(current, patch || {});
  return saveTrainingConfig(next);
}

export async function loadTrainingObservations() {
  const current = await readJson(TRAINING_PATHS.observations, []);
  return Array.isArray(current) ? current : [];
}

export async function appendTrainingObservation(observation) {
  const config = await loadTrainingConfig();
  const observations = await loadTrainingObservations();
  observations.push(observation);
  const retained = observations.slice(-Math.max(10, Number(config.max_observations_retained) || 500));
  await writeJson(TRAINING_PATHS.observations, retained);
  return observation;
}

export async function loadTrainingOverlays() {
  const current = await readJson(TRAINING_PATHS.overlays, DEFAULT_OVERLAYS);
  return mergeDeep(DEFAULT_OVERLAYS, current);
}

export async function saveTrainingOverlays(overlays) {
  const next = mergeDeep(DEFAULT_OVERLAYS, overlays || {});
  next.updated_at = new Date().toISOString();
  return writeJson(TRAINING_PATHS.overlays, next);
}

export async function loadTrainingState() {
  const current = await readJson(TRAINING_PATHS.state, DEFAULT_STATE);
  return mergeDeep(DEFAULT_STATE, current);
}

export async function saveTrainingState(state) {
  const next = mergeDeep(DEFAULT_STATE, state || {});
  return writeJson(TRAINING_PATHS.state, next);
}

export async function loadTrainingReviewQueue() {
  const current = await readJson(TRAINING_PATHS.reviewQueue, DEFAULT_REVIEW_QUEUE);
  return mergeDeep(DEFAULT_REVIEW_QUEUE, current);
}

export async function saveTrainingReviewQueue(queue) {
  const next = mergeDeep(DEFAULT_REVIEW_QUEUE, queue || {});
  next.updated_at = new Date().toISOString();
  return writeJson(TRAINING_PATHS.reviewQueue, next);
}

export async function loadTrainingInsights() {
  const current = await readJson(TRAINING_PATHS.insights, DEFAULT_INSIGHTS);
  return mergeDeep(DEFAULT_INSIGHTS, current);
}

export async function saveTrainingInsights(insights) {
  const next = mergeDeep(DEFAULT_INSIGHTS, insights || {});
  return writeJson(TRAINING_PATHS.insights, next);
}

export async function writeTrainingEvidence(prefix, payload) {
  await ensureDir();
  const file = join(EVIDENCE_DIR, `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.json`);
  await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8');
  return file;
}

export function getDefaultTrainingConfig() {
  return clone(DEFAULT_CONFIG);
}