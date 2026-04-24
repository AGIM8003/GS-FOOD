import assert from 'assert';
import {
  registerHook,
  runBeforeHooks,
  runAfterHooks,
  runErrorHooks,
  runRetryHooks,
  listRegisteredHooks,
  __resetHooksForTests,
} from '../src/swarm/lifecycleHooks.js';

function suite(name, fn) { console.log(`  suite: ${name}`); fn(); }
function test(name, fn) {
  try { fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

async function testAsync(name, fn) {
  try { await fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

console.log('lifecycle_hooks.test.js');

suite('registerHook', () => {
  __resetHooksForTests();

  test('registers a global hook', () => {
    registerHook('beforeNodeExecution', () => {}, { name: 'test-before' });
    const hooks = listRegisteredHooks();
    assert.ok(hooks.global.beforeNodeExecution.some((h) => h.name === 'test-before'));
  });

  test('registers a node-type-specific hook', () => {
    registerHook('afterNodeExecution', () => {}, { name: 'test-after', node_type: 'prompt_node' });
    const hooks = listRegisteredHooks();
    assert.ok(hooks.by_node_type.prompt_node.afterNodeExecution.some((h) => h.name === 'test-after'));
  });

  test('rejects invalid phase', () => {
    assert.throws(() => registerHook('invalid_phase', () => {}), /invalid hook phase/);
  });

  test('rejects non-function handler', () => {
    assert.throws(() => registerHook('onNodeError', 'not-a-function'), /hook handler must be a function/);
  });

  test('sorts hooks by priority', () => {
    __resetHooksForTests();
    registerHook('beforeNodeExecution', () => {}, { name: 'high', priority: 200 });
    registerHook('beforeNodeExecution', () => {}, { name: 'low', priority: 10 });
    registerHook('beforeNodeExecution', () => {}, { name: 'mid', priority: 50 });
    const hooks = listRegisteredHooks();
    const names = hooks.global.beforeNodeExecution.map((h) => h.name);
    assert.deepStrictEqual(names, ['low', 'mid', 'high']);
  });
});

suite('runBeforeHooks', async () => {
  __resetHooksForTests();

  await testAsync('proceeds when no hooks registered', async () => {
    const result = await runBeforeHooks({ node: { node_type: 'prompt_node' }, input: 'hello' });
    assert.strictEqual(result.proceed, true);
  });

  await testAsync('allows hook to skip execution', async () => {
    registerHook('beforeNodeExecution', () => ({ skip: true, fallback_output: 'skipped' }), { name: 'skipper' });
    const result = await runBeforeHooks({ node: { node_type: 'prompt_node' }, input: 'hello' });
    assert.strictEqual(result.proceed, false);
    assert.strictEqual(result.fallback_output, 'skipped');
  });

  __resetHooksForTests();

  await testAsync('allows hook to modify input', async () => {
    registerHook('beforeNodeExecution', (ctx) => ({ modified_input: ctx.input + '_modified' }), { name: 'modifier' });
    const result = await runBeforeHooks({ node: { node_type: 'prompt_node' }, input: 'hello' });
    assert.strictEqual(result.proceed, true);
    assert.strictEqual(result.modified_input, 'hello_modified');
  });
});

suite('runAfterHooks', async () => {
  __resetHooksForTests();

  await testAsync('passes through result when no hooks', async () => {
    const result = await runAfterHooks({ node: { node_type: 'prompt_node' } }, { output: 'original' });
    assert.strictEqual(result.output, 'original');
  });

  await testAsync('transforms output via hook', async () => {
    registerHook('afterNodeExecution', (ctx, result) => ({ output: result.output.toUpperCase() }), { name: 'upper' });
    const result = await runAfterHooks({ node: { node_type: 'prompt_node' } }, { output: 'hello' });
    assert.strictEqual(result.output, 'HELLO');
  });
});

suite('runErrorHooks', async () => {
  __resetHooksForTests();

  await testAsync('does not suppress when no hooks', async () => {
    const result = await runErrorHooks({ node: { node_type: 'prompt_node' } }, new Error('boom'));
    assert.strictEqual(result.suppress, false);
  });

  await testAsync('suppresses error with fallback', async () => {
    registerHook('onNodeError', () => ({ suppress: true, fallback_output: 'fallback' }), { name: 'suppressor' });
    const result = await runErrorHooks({ node: { node_type: 'prompt_node' } }, new Error('boom'));
    assert.strictEqual(result.suppress, true);
    assert.strictEqual(result.fallback_output, 'fallback');
  });
});

suite('runRetryHooks', async () => {
  __resetHooksForTests();

  await testAsync('invokes retry hooks without error', async () => {
    let called = false;
    registerHook('onNodeRetry', () => { called = true; }, { name: 'retryLogger' });
    await runRetryHooks({ node: { node_type: 'prompt_node' } }, 1, new Error('temp'));
    assert.strictEqual(called, true);
  });
});

suite('listRegisteredHooks', () => {
  __resetHooksForTests();
  registerHook('beforeNodeExecution', () => {}, { name: 'g1' });
  registerHook('onNodeError', () => {}, { name: 'e1', node_type: 'tool_node' });

  test('returns structured hook listing', () => {
    const hooks = listRegisteredHooks();
    assert.ok(hooks.global.beforeNodeExecution.length >= 1);
    assert.ok(hooks.by_node_type.tool_node.onNodeError.length >= 1);
  });
});

console.log('lifecycle_hooks.test.js: all passed');
