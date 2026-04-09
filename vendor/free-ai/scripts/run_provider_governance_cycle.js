#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { loadConfig } from '../src/config.js';
import { snapshotAll } from '../src/providers/budgetGuardian.js';
import { summarizeHealthMatrix } from '../src/providers/healthMatrix.js';
import { runGovernanceCycle } from '../src/providers/governance.js';

const cfg = await loadConfig();
execSync('node scripts/run_provider_probes.js', { stdio: 'inherit' });
const probeDir = path.join(process.cwd(), 'evidence', 'providers');
const latestProbe = fs.readdirSync(probeDir).filter((f) => f.startsWith('probe-') && f.endsWith('.json')).sort().reverse()[0];
const probe = latestProbe ? JSON.parse(fs.readFileSync(path.join(probeDir, latestProbe), 'utf8')) : null;
const state = runGovernanceCycle({ providers: cfg.providers || [], latestProbe: probe, quotaSnapshots: snapshotAll(), healthMatrix: summarizeHealthMatrix() });
const receipt = { generated_at: new Date().toISOString(), latest_probe: latestProbe || null, governance: state };
const file = path.join(probeDir, `governance-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(receipt, null, 2));
console.log('wrote', file);
