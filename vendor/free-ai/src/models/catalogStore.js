import fs from 'fs';
import path from 'path';
import { normalizeModelRecord } from './modelRecordSchema.js';

export function getModelControlPlaneDir(overrideRoot) {
  if (overrideRoot) return overrideRoot;
  if (process.env.FREEAI_MODEL_CONTROL_PLANE_DIR) return process.env.FREEAI_MODEL_CONTROL_PLANE_DIR;
  return path.join(process.cwd(), 'data', 'model_control_plane');
}

export function snapshotPath(root) {
  return path.join(getModelControlPlaneDir(root), 'catalog_snapshot.json');
}

export function refreshStatusPath(root) {
  return path.join(getModelControlPlaneDir(root), 'refresh_status.json');
}

export function promotionHistoryPath(root) {
  return path.join(getModelControlPlaneDir(root), 'promotion_events.jsonl');
}

export function pinsPath(root) {
  return path.join(getModelControlPlaneDir(root), 'pinned_models_by_lane.json');
}

/**
 * @param {string} [rootOverride]
 * @returns {{ schema_version: string, generated_at: string, overall_status: string, models: object[] }|null}
 */
export function readCatalogSnapshot(rootOverride) {
  const p = snapshotPath(rootOverride);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {object} snapshot
 * @param {string} [rootOverride]
 */
export function writeCatalogSnapshot(snapshot, rootOverride) {
  const dir = getModelControlPlaneDir(rootOverride);
  fs.mkdirSync(dir, { recursive: true });
  const snap = {
    schema_version: 'freeaiModelCatalogSnapshot.v1',
    overall_status: snapshot.overall_status || 'OK',
    generated_at: snapshot.generated_at || new Date().toISOString(),
    models: (snapshot.models || []).map((m) => normalizeModelRecord(m)),
  };
  fs.writeFileSync(snapshotPath(rootOverride), JSON.stringify(snap, null, 2), 'utf8');
  return snap;
}

export function writeRefreshStatus(status, rootOverride) {
  const dir = getModelControlPlaneDir(rootOverride);
  fs.mkdirSync(dir, { recursive: true });
  const body = {
    schema_version: 'freeaiModelRefreshStatus.v1',
    last_run_at: new Date().toISOString(),
    provider_status: status.provider_status || {},
    notes: status.notes || null,
  };
  fs.writeFileSync(refreshStatusPath(rootOverride), JSON.stringify(body, null, 2), 'utf8');
  return body;
}

export function readRefreshStatus(rootOverride) {
  const p = refreshStatusPath(rootOverride);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function appendPromotionEvent(event, rootOverride) {
  const dir = getModelControlPlaneDir(rootOverride);
  fs.mkdirSync(dir, { recursive: true });
  const line = JSON.stringify({ at: new Date().toISOString(), ...event }) + '\n';
  fs.appendFileSync(promotionHistoryPath(rootOverride), line, 'utf8');
}

export function readPinnedModelsByLane(rootOverride) {
  const p = pinsPath(rootOverride);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

export function writePinnedModelsByLane(map, rootOverride) {
  const dir = getModelControlPlaneDir(rootOverride);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(pinsPath(rootOverride), JSON.stringify(map, null, 2), 'utf8');
}
