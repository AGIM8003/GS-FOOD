import assert from 'assert';
import {
  validateSchema,
  validateAgainstSchema,
  validateNodeInputSchema,
  validateNodeOutputSchema,
} from '../src/swarm/schemaValidator.js';

function suite(name, fn) { console.log(`  suite: ${name}`); fn(); }
function test(name, fn) {
  try { fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

console.log('schema_validator.test.js');

suite('Type validation', () => {
  test('validates string type', () => {
    const errs = validateSchema('hello', { type: 'string' }, '$');
    assert.strictEqual(errs.length, 0);
  });

  test('rejects wrong type', () => {
    const errs = validateSchema(42, { type: 'string' }, '$');
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('expected type'));
  });

  test('validates integer', () => {
    assert.strictEqual(validateSchema(42, { type: 'integer' }, '$').length, 0);
    assert.ok(validateSchema(42.5, { type: 'integer' }, '$').length > 0);
  });

  test('validates boolean', () => {
    assert.strictEqual(validateSchema(true, { type: 'boolean' }, '$').length, 0);
    assert.ok(validateSchema('true', { type: 'boolean' }, '$').length > 0);
  });

  test('validates array type', () => {
    assert.strictEqual(validateSchema([1, 2], { type: 'array' }, '$').length, 0);
    assert.ok(validateSchema('not-array', { type: 'array' }, '$').length > 0);
  });

  test('validates null type', () => {
    assert.strictEqual(validateSchema(null, { type: 'null' }, '$').length, 0);
    assert.ok(validateSchema('', { type: 'null' }, '$').length > 0);
  });
});

suite('String constraints', () => {
  test('enforces minLength', () => {
    const errs = validateSchema('ab', { type: 'string', minLength: 5 }, '$');
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('minLength'));
  });

  test('enforces maxLength', () => {
    const errs = validateSchema('abcdef', { type: 'string', maxLength: 3 }, '$');
    assert.ok(errs.length > 0);
  });

  test('enforces pattern', () => {
    assert.strictEqual(validateSchema('abc123', { type: 'string', pattern: '^[a-z]+\\d+$' }, '$').length, 0);
    assert.ok(validateSchema('ABC', { type: 'string', pattern: '^[a-z]+$' }, '$').length > 0);
  });
});

suite('Number constraints', () => {
  test('enforces minimum', () => {
    assert.ok(validateSchema(3, { type: 'number', minimum: 5 }, '$').length > 0);
    assert.strictEqual(validateSchema(5, { type: 'number', minimum: 5 }, '$').length, 0);
  });

  test('enforces maximum', () => {
    assert.ok(validateSchema(10, { type: 'number', maximum: 5 }, '$').length > 0);
  });

  test('enforces exclusiveMinimum', () => {
    assert.ok(validateSchema(5, { type: 'number', exclusiveMinimum: 5 }, '$').length > 0);
    assert.strictEqual(validateSchema(6, { type: 'number', exclusiveMinimum: 5 }, '$').length, 0);
  });
});

suite('Enum and const', () => {
  test('enforces enum', () => {
    assert.strictEqual(validateSchema('a', { enum: ['a', 'b', 'c'] }, '$').length, 0);
    assert.ok(validateSchema('d', { enum: ['a', 'b', 'c'] }, '$').length > 0);
  });

  test('enforces const', () => {
    assert.strictEqual(validateSchema(42, { const: 42 }, '$').length, 0);
    assert.ok(validateSchema(43, { const: 42 }, '$').length > 0);
  });
});

suite('Array constraints', () => {
  test('enforces minItems', () => {
    assert.ok(validateSchema([1], { type: 'array', minItems: 3 }, '$').length > 0);
  });

  test('enforces maxItems', () => {
    assert.ok(validateSchema([1, 2, 3], { type: 'array', maxItems: 2 }, '$').length > 0);
  });

  test('validates items schema', () => {
    const errs = validateSchema([1, 'two', 3], { type: 'array', items: { type: 'number' } }, '$');
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes('[1]'));
  });
});

suite('Object constraints', () => {
  test('enforces required properties', () => {
    const errs = validateSchema({ name: 'test' }, {
      type: 'object',
      required: ['name', 'age'],
    }, '$');
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes("'age'"));
  });

  test('validates nested properties', () => {
    const errs = validateSchema({ name: 42 }, {
      type: 'object',
      properties: { name: { type: 'string' } },
    }, '$');
    assert.ok(errs.length > 0);
  });

  test('rejects additional properties when forbidden', () => {
    const errs = validateSchema({ name: 'test', extra: true }, {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: false,
    }, '$');
    assert.ok(errs.length > 0);
    assert.ok(errs[0].includes("'extra'"));
  });
});

suite('validateAgainstSchema', () => {
  test('auto-parses JSON string for non-string schemas', () => {
    const r = validateAgainstSchema('{"name":"test","age":25}', {
      type: 'object',
      required: ['name', 'age'],
      properties: { name: { type: 'string' }, age: { type: 'integer', minimum: 0 } },
    });
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.parsed, { name: 'test', age: 25 });
  });

  test('fails on unparseable JSON', () => {
    const r = validateAgainstSchema('not-json', { type: 'object' });
    assert.strictEqual(r.ok, false);
    assert.ok(r.errors[0].includes('failed to parse'));
  });

  test('returns ok for null schema', () => {
    const r = validateAgainstSchema('anything', null);
    assert.strictEqual(r.ok, true);
  });
});

suite('Node schema integration', () => {
  test('validateNodeInputSchema passes when no schema defined', () => {
    const r = validateNodeInputSchema({ data: 'test' }, {});
    assert.strictEqual(r.ok, true);
  });

  test('validateNodeOutputSchema validates against config.output_schema', () => {
    const config = {
      output_schema: {
        type: 'object',
        required: ['result'],
        properties: { result: { type: 'string' } },
      },
    };
    const r1 = validateNodeOutputSchema('{"result":"success"}', config);
    assert.strictEqual(r1.ok, true);

    const r2 = validateNodeOutputSchema('{"other":"field"}', config);
    assert.strictEqual(r2.ok, false);
  });
});

console.log('schema_validator.test.js: all passed');
