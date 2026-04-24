import assert from 'assert';
import {
  startNodeMetric,
  endNodeMetric,
  recordRetry,
  getNodeMetric,
  getRunMetrics,
  getCostBreakdown,
  __resetNodeMetricsForTests,
} from '../src/swarm/nodeMetrics.js';

function suite(name, fn) { console.log(`  suite: ${name}`); fn(); }
function test(name, fn) {
  try { fn(); console.log(`    ✓ ${name}`); }
  catch (e) { console.error(`    ✗ ${name}: ${e.message}`); throw e; }
}

console.log('node_metrics.test.js');

suite('startNodeMetric', () => {
  __resetNodeMetricsForTests();

  test('creates a metric entry', () => {
    const m = startNodeMetric('run-1', 'node-a', 'prompt_node');
    assert.strictEqual(m.node_id, 'node-a');
    assert.strictEqual(m.node_type, 'prompt_node');
    assert.strictEqual(m.status, 'running');
    assert.ok(m.started_at > 0);
  });
});

suite('endNodeMetric', () => {
  __resetNodeMetricsForTests();

  test('records completion with metrics', () => {
    startNodeMetric('run-2', 'node-b', 'prompt_node');
    const m = endNodeMetric('run-2', 'node-b', {
      ok: true,
      input_tokens: 100,
      output_tokens: 50,
      cost: 0.005,
      retries: 1,
      waste_tokens: 20,
    });
    assert.strictEqual(m.status, 'completed');
    assert.strictEqual(m.total_tokens, 150);
    assert.strictEqual(m.cost, 0.005);
    assert.strictEqual(m.retries, 1);
    assert.strictEqual(m.waste_tokens, 20);
    assert.ok(m.latency_ms >= 0);
  });

  test('records failure', () => {
    startNodeMetric('run-3', 'node-c', 'tool_node');
    const m = endNodeMetric('run-3', 'node-c', { ok: false, error: 'tool_not_found' });
    assert.strictEqual(m.status, 'failed');
    assert.strictEqual(m.error, 'tool_not_found');
  });
});

suite('recordRetry', () => {
  __resetNodeMetricsForTests();

  test('increments retry count and waste tokens', () => {
    startNodeMetric('run-4', 'node-d', 'prompt_node');
    recordRetry('run-4', 'node-d', 50);
    recordRetry('run-4', 'node-d', 30);
    const m = getNodeMetric('run-4', 'node-d');
    assert.strictEqual(m.retries, 2);
    assert.strictEqual(m.waste_tokens, 80);
  });
});

suite('getRunMetrics', () => {
  __resetNodeMetricsForTests();

  test('aggregates metrics across nodes', () => {
    startNodeMetric('run-5', 'n1', 'prompt_node');
    endNodeMetric('run-5', 'n1', { ok: true, input_tokens: 100, output_tokens: 50, cost: 0.01 });
    startNodeMetric('run-5', 'n2', 'tool_node');
    endNodeMetric('run-5', 'n2', { ok: true, input_tokens: 200, output_tokens: 100, cost: 0.02, waste_tokens: 10 });

    const metrics = getRunMetrics('run-5');
    assert.strictEqual(metrics.run_id, 'run-5');
    assert.strictEqual(metrics.nodes.length, 2);
    assert.strictEqual(metrics.totals.total_tokens, 450);
    assert.strictEqual(metrics.totals.total_cost, 0.03);
    assert.strictEqual(metrics.totals.waste_tokens, 10);
    assert.strictEqual(metrics.totals.node_count, 2);
    assert.ok(metrics.totals.waste_ratio < 0.03);
  });

  test('returns null for unknown run', () => {
    assert.strictEqual(getRunMetrics('unknown'), null);
  });
});

suite('getCostBreakdown', () => {
  __resetNodeMetricsForTests();

  test('returns cost breakdown sorted by cost descending', () => {
    startNodeMetric('run-6', 'cheap', 'tool_node');
    endNodeMetric('run-6', 'cheap', { ok: true, cost: 0.001 });
    startNodeMetric('run-6', 'expensive', 'prompt_node');
    endNodeMetric('run-6', 'expensive', { ok: true, cost: 0.05 });

    const breakdown = getCostBreakdown('run-6');
    assert.strictEqual(breakdown.nodes[0].node_id, 'expensive');
    assert.strictEqual(breakdown.nodes[1].node_id, 'cheap');
  });

  test('returns null for unknown run', () => {
    assert.strictEqual(getCostBreakdown('unknown'), null);
  });
});

console.log('node_metrics.test.js: all passed');
