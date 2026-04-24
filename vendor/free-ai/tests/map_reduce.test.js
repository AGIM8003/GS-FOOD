import assert from 'assert';
import {
  validateMapReduceConfig,
  evaluateMapper,
  splitInput,
  reduceResults,
  executeMapReduce,
} from '../src/swarm/mapReduce.js';

function suite(name, fn) { console.log(`  suite: ${name}`); fn(); }
function test(name, fn) {
  try { fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

async function testAsync(name, fn) {
  try { await fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

console.log('map_reduce.test.js');

suite('validateMapReduceConfig', () => {
  test('rejects null config', () => {
    assert.strictEqual(validateMapReduceConfig(null).ok, false);
  });

  test('accepts valid config with defaults', () => {
    const r = validateMapReduceConfig({});
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.reducer_strategy, 'json_array');
  });

  test('accepts custom reducer with expression', () => {
    const r = validateMapReduceConfig({ reducer_strategy: 'custom', reducer_expression: 'results.join(",")' });
    assert.strictEqual(r.ok, true);
  });

  test('rejects custom reducer without expression', () => {
    const r = validateMapReduceConfig({ reducer_strategy: 'custom' });
    assert.strictEqual(r.ok, false);
  });

  test('rejects invalid strategy', () => {
    const r = validateMapReduceConfig({ reducer_strategy: 'unknown' });
    assert.strictEqual(r.ok, false);
  });

  test('caps max_workers at 16', () => {
    const r = validateMapReduceConfig({ max_workers: 100 });
    assert.strictEqual(r.max_workers, 16);
  });
});

suite('evaluateMapper', () => {
  test('evaluates expression returning array', () => {
    const r = evaluateMapper('input.split(",")', 'a,b,c');
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, ['a', 'b', 'c']);
  });

  test('fails when expression returns non-array', () => {
    const r = evaluateMapper('"hello"', 'test');
    assert.strictEqual(r.ok, false);
  });
});

suite('splitInput', () => {
  test('splits JSON array string', () => {
    const r = splitInput('[1,2,3]', {});
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, [1, 2, 3]);
  });

  test('splits array input directly', () => {
    const r = splitInput(['a', 'b'], {});
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, ['a', 'b']);
  });

  test('wraps scalar string as single item', () => {
    const r = splitInput('hello', {});
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, ['hello']);
  });

  test('splits object values', () => {
    const r = splitInput({ a: 1, b: 2 }, {});
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, [1, 2]);
  });

  test('uses mapper_expression when provided', () => {
    const r = splitInput('1,2,3', { mapper_expression: 'input.split(",").map(Number)' });
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(r.items, [1, 2, 3]);
  });
});

suite('reduceResults', () => {
  const results = [
    { ok: true, output: 'alpha' },
    { ok: true, output: 'beta' },
    { ok: false, output: null },
  ];

  test('concatenate strategy', () => {
    const r = reduceResults(results, { reducer_strategy: 'concatenate' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.output, 'alpha\nbeta');
  });

  test('json_array strategy', () => {
    const r = reduceResults(results, { reducer_strategy: 'json_array' });
    assert.strictEqual(r.ok, true);
    assert.deepStrictEqual(JSON.parse(r.output), ['alpha', 'beta']);
  });

  test('first_valid strategy', () => {
    const r = reduceResults(results, { reducer_strategy: 'first_valid' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.output, 'alpha');
  });

  test('custom strategy', () => {
    const r = reduceResults(results, { reducer_strategy: 'custom', reducer_expression: 'results.join(" + ")' });
    assert.strictEqual(r.ok, true);
    assert.strictEqual(r.output, 'alpha + beta');
  });
});

suite('executeMapReduce', async () => {
  await testAsync('executes workers and reduces results', async () => {
    const workerFn = async (item) => ({ ok: true, output: `processed:${item}` });
    const result = await executeMapReduce({
      config: { reducer_strategy: 'json_array' },
      input: ['a', 'b', 'c'],
      workerFn,
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.worker_count, 3);
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.length, 3);
    assert.ok(parsed.includes('processed:a'));
  });

  await testAsync('handles worker failures gracefully', async () => {
    let call = 0;
    const workerFn = async (item) => {
      call++;
      if (call === 2) throw new Error('worker failed');
      return { ok: true, output: `done:${item}` };
    };
    const result = await executeMapReduce({
      config: { reducer_strategy: 'json_array' },
      input: ['x', 'y', 'z'],
      workerFn,
    });
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.worker_count, 3);
    const parsed = JSON.parse(result.output);
    assert.strictEqual(parsed.length, 2);
  });

  await testAsync('caps workers at max_workers', async () => {
    let count = 0;
    const workerFn = async () => { count++; return { ok: true, output: 'x' }; };
    await executeMapReduce({
      config: { max_workers: 2, reducer_strategy: 'concatenate' },
      input: [1, 2, 3, 4, 5],
      workerFn,
    });
    assert.strictEqual(count, 2);
  });
});

console.log('map_reduce.test.js: all passed');
