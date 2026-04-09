#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { readLastDecision } from '../src/providers/ladder.js';
import { summarizeHealthMatrix } from '../src/providers/healthMatrix.js';
import { snapshotAll } from '../src/providers/budgetGuardian.js';
import { listCooldowns } from '../src/providers/cooldownManager.js';
import { summarizeDecisionGraphs } from '../src/control/decisionGraph.js';
import { listPromotionReceipts } from '../src/prompt/promotion.js';
import { summarizeGraph } from '../src/memory/graph.js';

const report = {
  generated_at: new Date().toISOString(),
  provider_ladder: readLastDecision(),
  provider_health: summarizeHealthMatrix(),
  quota_snapshots: snapshotAll(),
  cooldowns: listCooldowns(),
  decision_graphs: summarizeDecisionGraphs(10),
  prompt_promotions: listPromotionReceipts(20),
  memory_graph: await summarizeGraph(),
};

const outDir = path.join(process.cwd(), 'evidence', 'reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `admin-status-${Date.now()}.json`);
fs.writeFileSync(file, JSON.stringify(report, null, 2));
console.log('wrote', file);
