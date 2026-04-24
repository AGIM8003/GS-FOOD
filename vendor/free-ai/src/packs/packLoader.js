import fs from 'fs';
import path from 'path';

const REQUIRED = ['pack_id', 'version'];

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function validatePackManifest(data, fileRel) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    errors.push(`${fileRel}: not_object`);
    return { valid: false, errors };
  }
  for (const k of REQUIRED) {
    if (data[k] == null || String(data[k]).length === 0) errors.push(`${fileRel}: missing_${k}`);
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Discover persona packs under personas/packs/<id>/manifest.json (excluding _template unless valid).
 */
export function listPersonaPacks() {
  const root = path.join(process.cwd(), 'personas', 'packs');
  if (!fs.existsSync(root)) return { packs: [], errors: [] };
  const errors = [];
  const packs = [];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    const dirName = name.name;
    if (dirName.startsWith('_')) continue;
    const manifestPath = path.join(root, dirName, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    const rel = path.join('personas', 'packs', dirName, 'manifest.json').replace(/\\/g, '/');
    const data = readJsonSafe(manifestPath);
    const v = validatePackManifest(data, rel);
    if (!v.valid) {
      errors.push(...v.errors);
      continue;
    }
    packs.push({
      pack_id: data.pack_id,
      version: data.version,
      title: data.title || null,
      directory: dirName,
      persona_ids: Array.isArray(data.persona_ids) ? data.persona_ids : [],
      skill_ids: Array.isArray(data.skill_ids) ? data.skill_ids : [],
    });
  }
  packs.sort((a, b) => a.pack_id.localeCompare(b.pack_id));
  return { packs, errors };
}

/**
 * Skill packs: skills/packs/<id>/manifest.json when present.
 */
export function listSkillPacks() {
  const root = path.join(process.cwd(), 'skills', 'packs');
  if (!fs.existsSync(root)) return { packs: [], errors: [] };
  const errors = [];
  const packs = [];
  for (const name of fs.readdirSync(root, { withFileTypes: true })) {
    if (!name.isDirectory()) continue;
    if (name.name.startsWith('_')) continue;
    if (name.name === 'README') continue;
    const manifestPath = path.join(root, name.name, 'manifest.json');
    if (!fs.existsSync(manifestPath)) continue;
    const rel = path.join('skills', 'packs', name.name, 'manifest.json').replace(/\\/g, '/');
    const data = readJsonSafe(manifestPath);
    const v = validatePackManifest(data, rel);
    if (!v.valid) {
      errors.push(...v.errors);
      continue;
    }
    packs.push({ pack_id: data.pack_id, version: data.version, title: data.title || null, directory: name.name });
  }
  packs.sort((a, b) => a.pack_id.localeCompare(b.pack_id));
  return { packs, errors };
}
