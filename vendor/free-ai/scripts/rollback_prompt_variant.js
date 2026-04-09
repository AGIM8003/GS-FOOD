#!/usr/bin/env node
import { rollbackVariant } from '../src/prompt/promotion.js';

const [familyId, rollbackTo = 'variant_a_default'] = process.argv.slice(2);
if (!familyId) {
  console.error('usage: node scripts/rollback_prompt_variant.js <familyId> [rollbackTo]');
  process.exit(2);
}

const receipt = rollbackVariant({ familyId, rollbackTo, reason: 'scripted_rollback' });
console.log(JSON.stringify(receipt, null, 2));
