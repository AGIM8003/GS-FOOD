import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

execSync('node scripts/bootstrap_host_project.js --dry-run', { stdio: 'inherit' });

const planPath = path.join(process.cwd(), 'out', 'host-bootstrap-preview', 'bootstrap-plan.json');
if (!fs.existsSync(planPath)) {
  console.error('bootstrap plan missing');
  process.exit(2);
}

const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
if (!plan.dry_run || !Array.isArray(plan.copied) || plan.copied.length === 0) {
  console.error('bootstrap plan invalid');
  process.exit(2);
}

console.log('bootstrap_host test OK');
