#!/usr/bin/env node
/**
 * Optional helper: suggest cost_tier hints from per-million input/output pricing (simple tier thresholds; see FREEAI.md §35.6.1).
 * Does not write providers.json unless --write is passed; default is stdout JSON for review.
 *
 * Usage:
 *   node scripts/annotate_provider_cost_tiers.js
 *   node scripts/annotate_provider_cost_tiers.js --write
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const PRICING_TIERS = {
  free: { maxInput: 0, maxOutput: 0 },
  cheap: { maxInput: 1, maxOutput: 2 },
  balanced: { maxInput: 10, maxOutput: 30 },
  premium: { maxInput: Infinity, maxOutput: Infinity },
};

export function determineCostTier(inputPricePerM, outputPricePerM) {
  const input = inputPricePerM ?? 0;
  const output = outputPricePerM ?? 0;
  if (input <= PRICING_TIERS.free.maxInput && output <= PRICING_TIERS.free.maxOutput) return 'free';
  if (input <= PRICING_TIERS.cheap.maxInput && output <= PRICING_TIERS.cheap.maxOutput) return 'cheap';
  if (input <= PRICING_TIERS.balanced.maxInput && output <= PRICING_TIERS.balanced.maxOutput) return 'balanced';
  return 'premium';
}

function main() {
  const root = process.cwd();
  const providersPath = path.join(root, 'providers.json');
  const raw = JSON.parse(fs.readFileSync(providersPath, 'utf8'));
  const isWrapped = raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray(raw.providers);
  const providers = isWrapped ? raw.providers : Array.isArray(raw) ? raw : [];
  const write = process.argv.includes('--write');

  const out = [];
  for (const p of providers) {
    const hintIn = p.pricing_input_per_million;
    const hintOut = p.pricing_output_per_million;
    const suggested =
      hintIn != null || hintOut != null
        ? determineCostTier(hintIn, hintOut)
        : p.pinnedModel && String(p.pinnedModel).toLowerCase().includes(':free')
          ? 'free'
          : null;
    const row = {
      id: p.id,
      pinnedModel: p.pinnedModel || null,
      existing_cost_tier: p.cost_tier || null,
      suggested_cost_tier: suggested,
    };
    out.push(row);
    if (write && suggested && !p.cost_tier) {
      p.cost_tier = suggested;
    }
  }

  if (write) {
    const payload = isWrapped ? { ...raw, providers } : providers;
    fs.writeFileSync(providersPath, JSON.stringify(payload, null, 2), 'utf8');
    console.log(JSON.stringify({ ok: true, updated: true, rows: out }, null, 2));
  } else {
    console.log(JSON.stringify({ ok: true, dry_run: true, rows: out }, null, 2));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
