import fs from 'fs';
import path from 'path';

/**
 * Directory for per-run JSON files (`{run_id}.json`).
 * Override with absolute `FREEAI_SWARM_RUNS_DIR`.
 */
export function getSwarmRunsDir() {
  const raw = process.env.FREEAI_SWARM_RUNS_DIR;
  if (raw && String(raw).trim()) return path.resolve(String(raw).trim());
  return path.join(process.cwd(), 'data', 'swarm_runs');
}

/** When `FREEAI_SWARM_PERSIST=0`, no disk reads/writes (tests / embedded hosts). */
export function isSwarmPersistenceEnabled() {
  return String(process.env.FREEAI_SWARM_PERSIST || '1').trim() !== '0';
}

export function ensureSwarmRunsDir() {
  const dir = getSwarmRunsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Atomic replace: write temp then rename.
 * @param {object} record full run record (must include run_id)
 */
export function writeRunRecordAtomic(record) {
  if (!isSwarmPersistenceEnabled() || !record?.run_id) return;
  const dir = ensureSwarmRunsDir();
  const file = path.join(dir, `${record.run_id}.json`);
  const tmp = path.join(dir, `.${record.run_id}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(tmp, `${JSON.stringify(record)}\n`, 'utf8');
  try {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  } catch {
    /* ignore */
  }
  fs.renameSync(tmp, file);
}

/**
 * Load all persisted run records (non-underscore JSON only).
 * @returns {object[]}
 */
export function loadAllRunRecords() {
  if (!isSwarmPersistenceEnabled()) return [];
  const dir = getSwarmRunsDir();
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json') || name.startsWith('_') || name.startsWith('.')) continue;
    try {
      const p = path.join(dir, name);
      const txt = fs.readFileSync(p, 'utf8').trim();
      if (!txt) continue;
      const rec = JSON.parse(txt);
      if (rec && typeof rec.run_id === 'string') out.push(rec);
    } catch {
      /* skip corrupt */
    }
  }
  return out;
}

/** Remove persisted run JSON files (for tests). Skips names starting with `_`. */
export function clearSwarmRunsDiskForTests() {
  if (!isSwarmPersistenceEnabled()) return;
  const dir = getSwarmRunsDir();
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json') || name.startsWith('_') || name.startsWith('.')) continue;
    try {
      fs.unlinkSync(path.join(dir, name));
    } catch {
      /* ignore */
    }
  }
}
