#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'freeai.engine.manifest.json'), 'utf8'));
const args = process.argv.slice(2);
const targetArg = args.find((a) => a.startsWith('--target='));
const dryRun = args.includes('--dry-run') || !targetArg;
const targetRoot = targetArg ? targetArg.split('=')[1] : path.join(root, 'out', 'host-bootstrap-preview');
const targetDir = path.join(targetRoot, 'vendor', 'free-ai');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry));
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

const plan = { generated_at: new Date().toISOString(), dry_run: dryRun, target_dir: targetDir, copied: [] };

for (const dir of manifest.required_directories || []) {
  const src = path.join(root, dir);
  const dest = path.join(targetDir, dir);
  plan.copied.push({ type: 'directory', src: dir, dest: path.relative(targetRoot, dest).replace(/\\/g, '/') });
  if (!dryRun && fs.existsSync(src)) copyRecursive(src, dest);
}
for (const file of manifest.authoritative_files || []) {
  const src = path.join(root, file);
  const dest = path.join(targetDir, file);
  plan.copied.push({ type: 'file', src: file, dest: path.relative(targetRoot, dest).replace(/\\/g, '/') });
  if (!dryRun && fs.existsSync(src)) copyRecursive(src, dest);
}

fs.mkdirSync(path.dirname(path.join(targetRoot, 'bootstrap-plan.json')), { recursive: true });
fs.writeFileSync(path.join(targetRoot, 'bootstrap-plan.json'), JSON.stringify(plan, null, 2));
console.log('wrote', path.join(targetRoot, 'bootstrap-plan.json'));
