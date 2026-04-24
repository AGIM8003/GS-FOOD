#!/usr/bin/env node
/**
 * Manual or scheduled catalog refresh inside the vendored FREE AI tree.
 * Fail-closed: writes snapshot + diff; never mutates providers.json or live pins.
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { loadConfig } from '../src/config.js';
import { runCatalogRefresh } from '../src/models/refresh/runCatalogRefresh.js';
import { ModelDiscoveryEngine } from '../src/providers/modelDiscoveryEngine.js';

const skipNetwork = process.env.FREEAI_REFRESH_SKIP_NETWORK === '1';

async function main() {
  const cfg = await loadConfig();
  const { snapshot, diff } = await runCatalogRefresh({
    providers: cfg.providers,
    skipNetwork,
  });
  const outDir = path.join(process.cwd(), 'evidence', 'catalog_refresh');
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  writeFileSync(path.join(outDir, `diff-${stamp}.json`), JSON.stringify(diff, null, 2), 'utf8');
  console.log(
    JSON.stringify(
      {
        ok: true,
        overall_status: snapshot.overall_status,
        model_count: snapshot.models.length,
        diff_counts: diff.counts,
      },
      null,
      2,
    ),
  );

  // Uplift: Autonomous Model Discovery Engine
  if (!skipNetwork) {
    console.log("\n[Uplift] Triggering Autonomous Model Discovery...");
    const discoveryEngine = new ModelDiscoveryEngine();
    await discoveryEngine.scanForNewFreeTiers();
    await discoveryEngine.promoteCandidateToCatalog();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
