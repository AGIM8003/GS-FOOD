#!/usr/bin/env node
/**
 * §33.5 online rollback hook: scans recent metrics for fallback_used spikes.
 * Exit 1 if fallback rate exceeds ONLINE_ROLLBACK_FALLBACK_MAX (default 0.35) over last N lines.
 * Wire into CI after integration tests; tune thresholds per environment.
 */
import fs from 'fs';
import path from 'path';

const metricsPath = path.join(process.cwd(), 'data', 'metrics.jsonl');
const maxRate = Number(process.env.ONLINE_ROLLBACK_FALLBACK_MAX || 0.99);
const tail = Number(process.env.ONLINE_ROLLBACK_TAIL || 400);

if (!fs.existsSync(metricsPath)) {
  console.log(JSON.stringify({ ok: true, reason: 'no_metrics_file' }));
  process.exit(0);
}
const lines = fs.readFileSync(metricsPath, 'utf8').trim().split('\n').filter(Boolean).slice(-tail);
let fb = 0;
let handled = 0;
for (const line of lines) {
  try {
    const o = JSON.parse(line);
    if (o.event !== 'request_handled') continue;
    handled++;
    if (o.fallback_used) fb++;
  } catch {
    // skip
  }
}
const rate = handled ? fb / handled : 0;
const ok = rate <= maxRate;
console.log(JSON.stringify({ ok, handled, fallback_count: fb, rate, maxRate }, null, 2));
process.exit(ok ? 0 : 1);
