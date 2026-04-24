/**
 * Node Lifecycle Hooks for swarm execution.
 *
 * Allows registering callbacks that fire at specific points in a node's lifecycle:
 *   - beforeNodeExecution(context) → can modify input or skip execution
 *   - afterNodeExecution(context, result) → can transform output or trigger side effects
 *   - onNodeError(context, error) → can suppress errors, provide fallback, or log
 *   - onNodeRetry(context, attempt, error) → notification hook for retry events
 *
 * Hooks are registered globally or per node_type. Node-level config can also
 * declare inline hook names that map to the global registry.
 */

const globalHooks = {
  beforeNodeExecution: [],
  afterNodeExecution: [],
  onNodeError: [],
  onNodeRetry: [],
};

const nodeTypeHooks = new Map();

function ensureNodeTypeHooks(nodeType) {
  if (!nodeTypeHooks.has(nodeType)) {
    nodeTypeHooks.set(nodeType, {
      beforeNodeExecution: [],
      afterNodeExecution: [],
      onNodeError: [],
      onNodeRetry: [],
    });
  }
  return nodeTypeHooks.get(nodeType);
}

/**
 * Register a lifecycle hook.
 *
 * @param {string} phase - 'beforeNodeExecution' | 'afterNodeExecution' | 'onNodeError' | 'onNodeRetry'
 * @param {Function} handler - async (context, ...args) => result
 * @param {object} [opts]
 * @param {string} [opts.node_type] - restrict to a specific node type
 * @param {string} [opts.name] - optional name for debugging
 * @param {number} [opts.priority] - lower runs first (default 100)
 */
function registerHook(phase, handler, opts = {}) {
  const validPhases = ['beforeNodeExecution', 'afterNodeExecution', 'onNodeError', 'onNodeRetry'];
  if (!validPhases.includes(phase)) {
    throw new Error(`invalid hook phase: ${phase}`);
  }
  if (typeof handler !== 'function') {
    throw new Error('hook handler must be a function');
  }

  const entry = {
    handler,
    name: opts.name || 'anonymous',
    priority: typeof opts.priority === 'number' ? opts.priority : 100,
  };

  if (opts.node_type) {
    const hooks = ensureNodeTypeHooks(opts.node_type);
    hooks[phase].push(entry);
    hooks[phase].sort((a, b) => a.priority - b.priority);
  } else {
    globalHooks[phase].push(entry);
    globalHooks[phase].sort((a, b) => a.priority - b.priority);
  }
}

function getHooksForPhase(phase, nodeType) {
  const global = globalHooks[phase] || [];
  const typed = nodeType && nodeTypeHooks.has(nodeType)
    ? (nodeTypeHooks.get(nodeType)[phase] || [])
    : [];
  return [...global, ...typed].sort((a, b) => a.priority - b.priority);
}

/**
 * Run beforeNodeExecution hooks. Returns { proceed: boolean, modified_input?: any }.
 * If any hook returns { skip: true }, execution is skipped with optional fallback output.
 */
async function runBeforeHooks(context) {
  const hooks = getHooksForPhase('beforeNodeExecution', context.node?.node_type);
  let modifiedInput = context.input;

  for (const hook of hooks) {
    try {
      const result = await hook.handler({ ...context, input: modifiedInput });
      if (result && result.skip) {
        return { proceed: false, fallback_output: result.fallback_output || null, hook_name: hook.name };
      }
      if (result && result.modified_input !== undefined) {
        modifiedInput = result.modified_input;
      }
    } catch {
      // Hook errors don't block execution
    }
  }
  return { proceed: true, modified_input: modifiedInput };
}

/**
 * Run afterNodeExecution hooks. Can transform the output.
 */
async function runAfterHooks(context, result) {
  const hooks = getHooksForPhase('afterNodeExecution', context.node?.node_type);
  let currentResult = result;

  for (const hook of hooks) {
    try {
      const transformed = await hook.handler(context, currentResult);
      if (transformed && transformed.output !== undefined) {
        currentResult = { ...currentResult, output: transformed.output };
      }
    } catch {
      // Hook errors don't alter the result
    }
  }
  return currentResult;
}

/**
 * Run onNodeError hooks. Can provide a fallback or suppress the error.
 * Returns { suppress: boolean, fallback_output?: string }.
 */
async function runErrorHooks(context, error) {
  const hooks = getHooksForPhase('onNodeError', context.node?.node_type);

  for (const hook of hooks) {
    try {
      const result = await hook.handler(context, error);
      if (result && result.suppress) {
        return { suppress: true, fallback_output: result.fallback_output || '', hook_name: hook.name };
      }
    } catch {
      // Ignore hook errors
    }
  }
  return { suppress: false };
}

/**
 * Notify onNodeRetry hooks (informational, no return value used).
 */
async function runRetryHooks(context, attempt, error) {
  const hooks = getHooksForPhase('onNodeRetry', context.node?.node_type);
  for (const hook of hooks) {
    try {
      await hook.handler(context, attempt, error);
    } catch {
      // Ignore
    }
  }
}

function listRegisteredHooks() {
  const result = { global: {}, by_node_type: {} };
  for (const [phase, hooks] of Object.entries(globalHooks)) {
    result.global[phase] = hooks.map((h) => ({ name: h.name, priority: h.priority }));
  }
  for (const [nodeType, phases] of nodeTypeHooks) {
    result.by_node_type[nodeType] = {};
    for (const [phase, hooks] of Object.entries(phases)) {
      result.by_node_type[nodeType][phase] = hooks.map((h) => ({ name: h.name, priority: h.priority }));
    }
  }
  return result;
}

function __resetHooksForTests() {
  for (const phase of Object.keys(globalHooks)) {
    globalHooks[phase] = [];
  }
  nodeTypeHooks.clear();
}

export {
  registerHook,
  getHooksForPhase,
  runBeforeHooks,
  runAfterHooks,
  runErrorHooks,
  runRetryHooks,
  listRegisteredHooks,
  __resetHooksForTests,
};
