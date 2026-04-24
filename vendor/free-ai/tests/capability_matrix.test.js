import assert from 'assert';
import { CAPABILITY_MATRIX, listCapabilityIds } from '../src/capabilities/capabilityMatrix.js';
import { taskContextToCapabilityId } from '../src/capabilities/taskToCapabilityMap.js';

assert.ok(CAPABILITY_MATRIX.length >= 8);
assert.ok(listCapabilityIds().includes('plain_text_chat'));
assert.strictEqual(taskContextToCapabilityId({ response_contract_id: 'json_v1' }), 'json_extraction');

console.log('capability_matrix test OK');
