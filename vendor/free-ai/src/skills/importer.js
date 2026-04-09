import fs from 'fs';
import path from 'path';
import { validate as schemaValidate } from '../schemaValidator.js';

const skillsDir = path.resolve(process.cwd(), 'skills');
const evidenceDir = path.resolve(process.cwd(), 'evidence', 'imports');

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function normalizeSkillSignature(skill) {
  const key = `${skill.name}|${skill.purpose}|${(skill.triggers||[]).join(',')}`.toLowerCase();
  return key.replace(/\s+/g, ' ').trim();
}

export function loadCatalog() {
  const activePath = path.join(skillsDir, 'active_catalog.json');
  const catalogPath = path.join(skillsDir, 'catalog.json');
  if (fs.existsSync(activePath)) {
    const payload = JSON.parse(fs.readFileSync(activePath, 'utf8'));
    return { ok: true, payload, source: 'active' };
  }
  if (!fs.existsSync(catalogPath)) return { ok: false, error: 'catalog_not_found' };
  const payload = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  return { ok: true, payload, source: 'raw' };
}

export function importAll({ dedupe=true } = {}) {
  ensureDir(evidenceDir);
  const catalog = loadCatalog();
  if (!catalog.ok) return catalog;

  const seen = new Map();
  const results = [];

  for (const skill of catalog.payload.skills || []) {
    const receipt = { skill_id: skill.id, imported_at: new Date().toISOString(), schema_version: skill.schema_version || 'skillManifest.v1' };
    const validation = schemaValidate('skillManifest', skill);
    receipt.valid = validation.valid;
    receipt.errors = validation.errors;

    const sig = normalizeSkillSignature(skill);
    if (dedupe && seen.has(sig)) {
      receipt.action = 'duplicate';
      receipt.duplicate_of = seen.get(sig);
      skill.deprecated = true;
    } else {
      receipt.action = 'added';
      seen.set(sig, skill.id);
    }

    const dest = path.join(evidenceDir, `import-${skill.id}.json`);
    fs.writeFileSync(dest, JSON.stringify({ skill, receipt }, null, 2));
    results.push(receipt);
  }

  return { ok: true, results };
}

export default { loadCatalog, importAll };
