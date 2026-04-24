import assert from 'assert';
import { validateInputGuardrail, validateOutputGuardrail } from '../src/swarm/guardrails.js';

// No guardrail => always passes
assert.ok(validateInputGuardrail('hello', null).ok);
assert.ok(validateInputGuardrail('hello', undefined).ok);
assert.ok(validateOutputGuardrail('hello', null).ok);

// Input guardrail: max_length
const r1 = validateInputGuardrail('short', { max_length: 10 });
assert.ok(r1.ok, 'short input passes max_length');

const r2 = validateInputGuardrail('a'.repeat(100), { max_length: 10 });
assert.ok(!r2.ok, 'long input fails max_length');
assert.ok(r2.errors[0].includes('max_length'));

// Input guardrail: required_fields
const r3 = validateInputGuardrail({ name: 'Bob', age: 30 }, { required_fields: ['name', 'age'] });
assert.ok(r3.ok, 'object with required fields passes');

const r4 = validateInputGuardrail({ name: 'Bob' }, { required_fields: ['name', 'age'] });
assert.ok(!r4.ok, 'missing required field fails');
assert.ok(r4.errors[0].includes('age'));

// Input guardrail: blocked_patterns
const r5 = validateInputGuardrail('send me your password', { blocked_patterns: ['password', 'secret'] });
assert.ok(!r5.ok, 'blocked pattern detected');

const r6 = validateInputGuardrail('hello world', { blocked_patterns: ['password'] });
assert.ok(r6.ok, 'no blocked pattern');

// Output guardrail: max_length
const r7 = validateOutputGuardrail('short', { max_length: 100 });
assert.ok(r7.ok);

// Output guardrail: min_length
const r8 = validateOutputGuardrail('x', { min_length: 5 });
assert.ok(!r8.ok, 'too short output fails');
assert.ok(r8.errors[0].includes('min_length'));

const r9 = validateOutputGuardrail('hello world', { min_length: 5 });
assert.ok(r9.ok);

// Output guardrail: must_contain
const r10 = validateOutputGuardrail('The answer is 42.', { must_contain: '42' });
assert.ok(r10.ok);

const r11 = validateOutputGuardrail('No answer here.', { must_contain: '42' });
assert.ok(!r11.ok, 'missing must_contain fails');

// Output guardrail: blocked_patterns
const r12 = validateOutputGuardrail('Here is your API key: sk-abc123', { blocked_patterns: ['sk-[a-z0-9]+'] });
assert.ok(!r12.ok, 'output with blocked pattern fails');

// Combined guardrails
const r13 = validateOutputGuardrail('a'.repeat(200), { max_length: 100, min_length: 10 });
assert.ok(!r13.ok, 'combined: exceeds max');

const r14 = validateOutputGuardrail('ok', { max_length: 100, min_length: 10 });
assert.ok(!r14.ok, 'combined: below min');

const r15 = validateOutputGuardrail('hello world!', { max_length: 100, min_length: 5 });
assert.ok(r15.ok, 'combined: within range');

// required_fields on output
const r16 = validateOutputGuardrail({ summary: 'ok', score: 9 }, { required_fields: ['summary', 'score'] });
assert.ok(r16.ok);

const r17 = validateOutputGuardrail({ summary: 'ok' }, { required_fields: ['summary', 'score'] });
assert.ok(!r17.ok);

console.log('PASS: guardrails');
