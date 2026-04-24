/**
 * Host GTM markdown filename token must not appear under engine trees `src/` or `scripts/`
 * (docs/tests may cite it; integration kit output is generated, not scanned here).
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

const root = process.cwd();
const needle = 'HOST_HORIZONTAL_GTM_OUTLINE';
const scanRoots = ['src', 'scripts'];

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
    } else if (name.isFile() && name.name.endsWith('.js')) {
      out.push(childAbs);
    }
  }
  return out;
}

let scanned = 0;
for (const top of scanRoots) {
  for (const file of walk(top)) {
    scanned += 1;
    const t = fs.readFileSync(file, 'utf8');
    assert.ok(
      !t.includes(needle),
      `must not embed host GTM doc token: file=${path.relative(root, file).replace(/\\/g, '/')} | token=${needle}`,
    );
  }
}

assert.ok(scanned > 10, `expected many files under ${scanRoots.join('/')}, got ${scanned}`);
console.log(`gtm_separation test OK (${scanned} files)`);
