import assert from 'assert';
import { buildProviderDiscoveryRegistry } from '../src/providers/registry.js';
import { validateDiscoveryRecord } from '../src/providers/providerCatalogSchema.js';

const rows = buildProviderDiscoveryRegistry([
  { id: 'openrouter', displayName: 'OpenRouter', enabled: true, free_tier_eligible: true, envKey: 'K' },
]);
assert.strictEqual(rows.length, 1);
assert.strictEqual(rows[0].provider_id, 'openrouter');
assert.strictEqual(rows[0].supports_auto_catalog_refresh, true);
const v = validateDiscoveryRecord(rows[0]);
assert.ok(v.ok, v.errors?.join(','));

console.log('provider_registry test OK');
