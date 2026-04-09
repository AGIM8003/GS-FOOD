import { getActiveVariant, promoteVariant, rollbackVariant } from '../src/prompt/promotion.js';

const familyId = 'general';
promoteVariant({ familyId, variantId: 'variant_b_structured', reason: 'test_promotion' });
const promoted = getActiveVariant(familyId, 'variant_a_default');
if (promoted !== 'variant_b_structured') {
  console.error('prompt promotion failed');
  process.exit(2);
}

rollbackVariant({ familyId, rollbackTo: 'variant_a_default', reason: 'test_rollback' });
const rolledBack = getActiveVariant(familyId, 'variant_a_default');
if (rolledBack !== 'variant_a_default') {
  console.error('prompt rollback failed');
  process.exit(2);
}

console.log('prompt_promotion test OK');
