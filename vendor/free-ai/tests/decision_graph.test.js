import fs from 'fs';
import path from 'path';
import { Router } from '../src/server/router.js';

const cfg = { root: process.cwd(), providers: [] };
const router = new Router(cfg);
await router.handleRequest({ prompt: 'Create a short plan for testing decision graphs.' });

const dir = path.join(process.cwd(), 'evidence', 'decision-graphs');
if (!fs.existsSync(dir)) {
  console.error('decision graph directory missing');
  process.exit(2);
}

const files = fs.readdirSync(dir).filter((file) => file.endsWith('.json'));
if (files.length === 0) {
  console.error('no decision graph records found');
  process.exit(2);
}

const latest = JSON.parse(fs.readFileSync(path.join(dir, files.sort().reverse()[0]), 'utf8'));
if (!latest.graph_id || !latest.trace_id) {
  console.error('decision graph missing graph_id or trace_id');
  process.exit(2);
}

console.log('decision_graph test OK');
