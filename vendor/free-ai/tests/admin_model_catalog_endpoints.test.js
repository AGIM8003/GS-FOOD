import assert from 'assert';
import {
  getModelCatalogSummary,
  getModelPins,
  getModelRefreshStatus,
  getModelPromotionHistory,
} from '../src/server/admin.js';

const s = await getModelCatalogSummary();
assert.ok(s.schema_version);
assert.ok('model_count' in s);

const pins = await getModelPins();
assert.ok(pins.lanes);

const st = await getModelRefreshStatus();
assert.ok(st.schema_version);

const hist = await getModelPromotionHistory();
assert.ok(Array.isArray(hist.events));

console.log('admin_model_catalog_endpoints test OK');
