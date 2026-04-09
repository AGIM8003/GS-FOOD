#!/usr/bin/env node
import { promoteVariant } from '../src/prompt/promotion.js';

const [familyId, variantId] = process.argv.slice(2);
if (!familyId || !variantId) {
  console.error('usage: node scripts/promote_prompt_variant.js <familyId> <variantId>');
  process.exit(2);
}

const receipt = promoteVariant({ familyId, variantId, reason: 'scripted_promotion' });
console.log(JSON.stringify(receipt, null, 2));
