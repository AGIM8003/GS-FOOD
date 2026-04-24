/**
 * Map-Reduce / Dynamic Fan-Out for swarm execution.
 *
 * Enables runtime task spawning: a mapper node can dynamically generate
 * worker tasks, which execute in parallel and reduce into a single output.
 *
 * Graph-level: { node_type: 'map_reduce_node', config: { mapper, reducer, max_workers } }
 *
 * The mapper function receives predecessor outputs and returns an array of work items.
 * Each work item is executed against a worker function. Results are collected and
 * passed to the reducer, which produces a single merged output.
 */

const DEFAULT_MAX_WORKERS = 16;

/**
 * @typedef {object} MapReduceConfig
 * @property {string} [mapper_expression] - JS expression that returns array of work items from `input`
 * @property {string} [reducer_strategy] - 'concatenate' | 'json_array' | 'first_valid' | 'custom'
 * @property {string} [reducer_expression] - JS expression for custom reducer (receives `results` array)
 * @property {number} [max_workers] - cap on parallel workers
 * @property {string} [worker_node_type] - 'prompt_node' | 'tool_node' (default 'prompt_node')
 * @property {object} [worker_config] - config passed to each spawned worker node
 */

function validateMapReduceConfig(config) {
  if (!config || typeof config !== 'object') {
    return { ok: false, error: 'map_reduce config required' };
  }
  const maxWorkers = typeof config.max_workers === 'number'
    ? Math.min(Math.max(config.max_workers, 1), DEFAULT_MAX_WORKERS)
    : DEFAULT_MAX_WORKERS;

  const validStrategies = ['concatenate', 'json_array', 'first_valid', 'custom'];
  const strategy = config.reducer_strategy || 'json_array';
  if (!validStrategies.includes(strategy)) {
    return { ok: false, error: `invalid reducer_strategy: ${strategy}` };
  }
  if (strategy === 'custom' && typeof config.reducer_expression !== 'string') {
    return { ok: false, error: 'custom reducer_strategy requires reducer_expression' };
  }

  return { ok: true, max_workers: maxWorkers, reducer_strategy: strategy };
}

function evaluateMapper(expression, input) {
  try {
    const fn = new Function('input', `return (${expression})`);
    const result = fn(input);
    if (!Array.isArray(result)) return { ok: false, error: 'mapper must return array' };
    return { ok: true, items: result };
  } catch (e) {
    return { ok: false, error: `mapper_expression error: ${e.message}` };
  }
}

function splitInput(input, config) {
  if (config.mapper_expression) {
    return evaluateMapper(config.mapper_expression, input);
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) return { ok: true, items: parsed };
      return { ok: true, items: [parsed] };
    } catch {
      return { ok: true, items: [input] };
    }
  }
  if (Array.isArray(input)) return { ok: true, items: input };
  if (input && typeof input === 'object') {
    return { ok: true, items: Object.values(input) };
  }
  return { ok: true, items: [input] };
}

function reduceResults(results, config) {
  const strategy = config.reducer_strategy || 'json_array';
  const successful = results.filter((r) => r.ok);

  if (strategy === 'concatenate') {
    return { ok: true, output: successful.map((r) => String(r.output)).join('\n') };
  }
  if (strategy === 'json_array') {
    return { ok: true, output: JSON.stringify(successful.map((r) => r.output)) };
  }
  if (strategy === 'first_valid') {
    const first = successful[0];
    if (!first) return { ok: false, output: null, error: 'no valid worker results' };
    return { ok: true, output: typeof first.output === 'string' ? first.output : JSON.stringify(first.output) };
  }
  if (strategy === 'custom' && config.reducer_expression) {
    try {
      const fn = new Function('results', `return (${config.reducer_expression})`);
      const out = fn(successful.map((r) => r.output));
      return { ok: true, output: typeof out === 'string' ? out : JSON.stringify(out) };
    } catch (e) {
      return { ok: false, output: null, error: `reducer_expression error: ${e.message}` };
    }
  }
  return { ok: false, output: null, error: `unknown reducer_strategy: ${strategy}` };
}

/**
 * Execute a map-reduce fan-out.
 *
 * @param {object} params
 * @param {object} params.config - MapReduceConfig
 * @param {any} params.input - input from predecessor nodes
 * @param {(workItem: any, index: number) => Promise<{ ok: boolean, output: any }>} params.workerFn
 * @returns {Promise<{ ok: boolean, output: string|null, worker_count: number, results: object[], error?: string }>}
 */
async function executeMapReduce({ config, input, workerFn }) {
  const validation = validateMapReduceConfig(config);
  if (!validation.ok) {
    return { ok: false, output: null, worker_count: 0, results: [], error: validation.error };
  }

  const split = splitInput(input, config);
  if (!split.ok) {
    return { ok: false, output: null, worker_count: 0, results: [], error: split.error };
  }

  const items = split.items.slice(0, validation.max_workers);
  const workerResults = await Promise.all(
    items.map((item, idx) =>
      workerFn(item, idx).catch((err) => ({ ok: false, output: null, error: err?.message || String(err) }))
    )
  );

  const reduced = reduceResults(workerResults, config);
  return {
    ok: reduced.ok,
    output: reduced.output,
    worker_count: items.length,
    results: workerResults,
    error: reduced.error || undefined,
  };
}

export {
  DEFAULT_MAX_WORKERS,
  validateMapReduceConfig,
  evaluateMapper,
  splitInput,
  reduceResults,
  executeMapReduce,
};
