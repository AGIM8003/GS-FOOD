#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const manifestPath = path.join(root, 'freeai.engine.manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('missing freeai.engine.manifest.json');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const missingAuth = (manifest.authoritative_files || []).filter((rel) => !fs.existsSync(path.join(root, rel)));
const missingDirs = (manifest.required_directories || []).filter((rel) => !fs.existsSync(path.join(root, rel)));
if (missingAuth.length || missingDirs.length) {
  console.error(JSON.stringify({ missing_authoritative: missingAuth, missing_directories: missingDirs }, null, 2));
  process.exit(1);
}
console.log('manifest ok');
