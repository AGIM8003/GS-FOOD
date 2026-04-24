#!/usr/bin/env node
/**
 * Prune files under evidence/ older than N days (default 14). Keeps directory tree.
 * Usage: node scripts/prune_evidence.js [--days=14] [--dry-run]
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const evidenceRoot = path.join(root, 'evidence');
const args = {};
let dry = false;
for (const a of process.argv.slice(2)) {
  if (a === '--dry-run') {
    dry = true;
    continue;
  }
  const m = /^--([^=]+)=(.*)$/.exec(a);
  if (m) args[m[1]] = m[2];
}
const days = Number(args.days) > 0 ? Number(args.days) : 14;
const cutoff = Date.now() - days * 86400 * 1000;
const keepBaselineReports = String(args.keep_baseline_reports || '1') !== '0';
const protectedDirs = keepBaselineReports
  ? [
      path.join(evidenceRoot, 'reports', 'soak'),
      path.join(evidenceRoot, 'reports', 'benchmark'),
    ]
  : [];

let removed = 0;
let bytes = 0;

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  if (protectedDirs.some((p) => dir.startsWith(p))) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (protectedDirs.some((p) => full.startsWith(p))) continue;
    if (st.isDirectory()) walk(full);
    else if (st.isFile() && st.mtimeMs < cutoff) {
      bytes += st.size;
      if (!dry) fs.unlinkSync(full);
      removed++;
    }
  }
}

walk(evidenceRoot);
console.log(JSON.stringify({
  evidenceRoot,
  days,
  dry,
  keep_baseline_reports: keepBaselineReports,
  protected_dirs: protectedDirs.map((p) => path.relative(root, p)),
  removed_files: removed,
  approx_bytes_freed: bytes,
}, null, 2));
