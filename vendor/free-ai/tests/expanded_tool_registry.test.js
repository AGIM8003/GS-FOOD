import assert from 'assert';
import { listTools, getTool, clearRegistry } from '../src/swarm/toolRegistry.js';

const tools = listTools();
assert.ok(tools.length >= 20, `expected >=20 tools, got ${tools.length}`);

const ids = tools.map((t) => t.tool_id);
const expectedIds = [
  'identity_transform', 'json_extract_field', 'template_render', 'lookup_registry',
  'string_uppercase', 'string_lowercase', 'string_trim', 'string_split', 'string_join',
  'string_replace', 'string_length', 'string_slice',
  'array_sort', 'array_filter_truthy', 'array_unique', 'array_flatten', 'array_length',
  'math_sum', 'math_average', 'math_round', 'math_min_max', 'math_clamp',
  'date_iso_now', 'date_parse', 'hash_sha256', 'base64_encode', 'base64_decode',
  'json_stringify', 'json_parse', 'regex_match', 'regex_replace',
  'object_keys', 'object_values', 'object_merge', 'object_pick',
  'conditional_select', 'counter',
];
for (const eid of expectedIds) {
  assert.ok(ids.includes(eid), `missing tool: ${eid}`);
}

// Functional tests for each tool
const exec = (id, input) => getTool(id).execute(input);

assert.deepStrictEqual(exec('identity_transform', { x: 1 }), { x: 1 });
assert.deepStrictEqual(exec('json_extract_field', { data: '{"a":42}', field: 'a' }), { value: 42 });
assert.deepStrictEqual(exec('template_render', { template: 'Hi {{name}}', variables: { name: 'World' } }), { rendered: 'Hi World' });
assert.deepStrictEqual(exec('lookup_registry', { key: 'k', map: { k: 'v' } }), { value: 'v' });

assert.deepStrictEqual(exec('string_uppercase', { text: 'abc' }), { value: 'ABC' });
assert.deepStrictEqual(exec('string_lowercase', { text: 'ABC' }), { value: 'abc' });
assert.deepStrictEqual(exec('string_trim', { text: '  x  ' }), { value: 'x' });
assert.deepStrictEqual(exec('string_split', { text: 'a,b,c', delimiter: ',' }), { value: ['a', 'b', 'c'] });
assert.deepStrictEqual(exec('string_join', { items: ['a', 'b'], separator: '-' }), { value: 'a-b' });
assert.deepStrictEqual(exec('string_replace', { text: 'hello world', search: 'world', replacement: 'there' }), { value: 'hello there' });
assert.deepStrictEqual(exec('string_length', { text: 'abc' }), { value: 3 });
assert.deepStrictEqual(exec('string_slice', { text: 'abcdef', start: 1, end: 4 }), { value: 'bcd' });

assert.deepStrictEqual(exec('array_sort', { items: [3, 1, 2], numeric: true }), { value: [1, 2, 3] });
assert.deepStrictEqual(exec('array_filter_truthy', { items: [0, 1, '', 'a', null] }), { value: [1, 'a'] });
assert.deepStrictEqual(exec('array_unique', { items: [1, 2, 2, 3] }), { value: [1, 2, 3] });
assert.deepStrictEqual(exec('array_flatten', { items: [[1, 2], [3]] }), { value: [1, 2, 3] });
assert.deepStrictEqual(exec('array_length', { items: [1, 2, 3] }), { value: 3 });

assert.deepStrictEqual(exec('math_sum', { numbers: [1, 2, 3] }), { value: 6 });
assert.deepStrictEqual(exec('math_average', { numbers: [10, 20] }), { value: 15 });
assert.deepStrictEqual(exec('math_round', { number: 3.1416, decimals: 2 }), { value: 3.14 });
const mm = exec('math_min_max', { numbers: [5, 1, 9] });
assert.strictEqual(mm.min, 1);
assert.strictEqual(mm.max, 9);
assert.deepStrictEqual(exec('math_clamp', { number: 15, min: 0, max: 10 }), { value: 10 });

const now = exec('date_iso_now', {});
assert.ok(now.value.includes('T'), 'date_iso_now should return ISO string');

const dp = exec('date_parse', { date_string: '2026-01-15T00:00:00Z' });
assert.ok(dp.iso.startsWith('2026-01-15'));
assert.ok(typeof dp.epoch_ms === 'number');

const h = exec('hash_sha256', { text: 'hello' });
assert.ok(h.value && h.value.length === 64, 'sha256 hash should be 64 hex chars');

assert.deepStrictEqual(exec('base64_encode', { text: 'hello' }), { value: 'aGVsbG8=' });
assert.deepStrictEqual(exec('base64_decode', { text: 'aGVsbG8=' }), { value: 'hello' });

const js = exec('json_stringify', { data: { a: 1 } });
assert.strictEqual(js.value, '{"a":1}');
assert.deepStrictEqual(exec('json_parse', { text: '{"a":1}' }), { value: { a: 1 } });

const rm = exec('regex_match', { text: 'hello123', pattern: '(\\d+)' });
assert.ok(rm.matched);
assert.strictEqual(rm.groups[0], '123');

const rr = exec('regex_replace', { text: 'hello 123 world', pattern: '\\d+', replacement: 'NUM' });
assert.strictEqual(rr.value, 'hello NUM world');

assert.deepStrictEqual(exec('object_keys', { data: { a: 1, b: 2 } }), { value: ['a', 'b'] });
assert.deepStrictEqual(exec('object_values', { data: { a: 1, b: 2 } }), { value: [1, 2] });
assert.deepStrictEqual(exec('object_merge', { objects: [{ a: 1 }, { b: 2 }] }), { value: { a: 1, b: 2 } });
assert.deepStrictEqual(exec('object_pick', { data: { a: 1, b: 2, c: 3 }, keys: ['a', 'c'] }), { value: { a: 1, c: 3 } });

assert.deepStrictEqual(exec('conditional_select', { condition: true, value_if_true: 'yes', value_if_false: 'no' }), { value: 'yes' });
assert.deepStrictEqual(exec('conditional_select', { condition: false, value_if_true: 'yes', value_if_false: 'no' }), { value: 'no' });

assert.deepStrictEqual(exec('counter', { current: 5, increment: 3 }), { value: 8 });
assert.deepStrictEqual(exec('counter', {}), { value: 1 });

console.log(`PASS: expanded_tool_registry (${tools.length} tools)`);
