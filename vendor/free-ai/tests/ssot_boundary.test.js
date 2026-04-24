/**
 * SSOT boundary: `src/` and `scripts/` must not reference forbidden sibling-product tokens.
 * Canonical token rules: ./ssot_forbidden_tokens.js (not scanned).
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { FORBIDDEN_RULES } from './ssot_forbidden_tokens.js';

const root = process.cwd();
const SCAN_TOP = ['src', 'scripts'];
const EXT = new Set(['.js', '.mjs', '.cjs']);

function walk(relDir) {
  const abs = path.join(root, relDir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const name of fs.readdirSync(abs, { withFileTypes: true })) {
    const childRel = path.join(relDir, name.name);
    const childAbs = path.join(root, childRel);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === '.git') continue;
      out.push(...walk(childRel));
    } else if (name.isFile() && EXT.has(path.extname(name.name))) {
      out.push(childAbs);
    }
  }
  return out;
}

function firstMatchLine(text, re) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].search(re) >= 0) return { line: i + 1, snippet: lines[i].trim().slice(0, 200) };
  }
  return { line: null, snippet: null };
}

let scanned = 0;
for (const top of SCAN_TOP) {
  for (const file of walk(top)) {
    scanned += 1;
    const text = fs.readFileSync(file, 'utf8');
    for (const rule of FORBIDDEN_RULES) {
      if (rule.pattern.test(text)) {
        const rel = path.relative(root, file).replace(/\\/g, '/');
        const { line, snippet } = firstMatchLine(text, rule.pattern);
        const msg = [
          `SSOT violation: rule=${rule.id} token=${rule.label}`,
          `file=${rel}`,
          line != null ? `line=${line}` : 'line=unknown',
          snippet ? `snippet=${JSON.stringify(snippet)}` : '',
        ]
          .filter(Boolean)
          .join(' | ');
        assert.fail(msg);
      }
    }
  }
}

assert.ok(scanned > 10, `expected many source files, got ${scanned}`);
console.log(`ssot_boundary test OK (${scanned} files under ${SCAN_TOP.join(', ')}/)`);
