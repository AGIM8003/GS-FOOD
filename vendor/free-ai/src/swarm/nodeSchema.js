const PROMPT = 'prompt_node';
const MERGE = 'merge_node';
const FINAL = 'finalization_node';
const HUMAN_REVIEW = 'human_review_node';
const TOOL = 'tool_node';
const SUBGRAPH = 'subgraph_node';
const ROUTER = 'router_node';
const MAP_REDUCE = 'map_reduce_node';

const MERGE_STRATEGIES = ['deterministic_priority', 'first_valid'];

const V1_NODE_TYPES = [PROMPT, MERGE, FINAL];
const V3_NODE_TYPES = [PROMPT, MERGE, FINAL, HUMAN_REVIEW, TOOL];
const V4_NODE_TYPES = [PROMPT, MERGE, FINAL, HUMAN_REVIEW, TOOL, SUBGRAPH, ROUTER];
const V5_NODE_TYPES = [PROMPT, MERGE, FINAL, HUMAN_REVIEW, TOOL, SUBGRAPH, ROUTER, MAP_REDUCE];

/**
 * @param {unknown} n
 * @param {{ allowV3?: boolean }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
/**
 * @param {unknown} n
 * @param {{ allowV3?: boolean, allowV4?: boolean }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateNodeV1(n, opts) {
  if (!n || typeof n !== 'object') return { ok: false, error: 'node must be object' };
  if (typeof n.node_id !== 'string' || !n.node_id.trim()) return { ok: false, error: 'node.node_id required' };

  const allowed = opts?.allowV5 ? V5_NODE_TYPES : opts?.allowV4 ? V4_NODE_TYPES : opts?.allowV3 ? V3_NODE_TYPES : V1_NODE_TYPES;
  if (!allowed.includes(n.node_type)) {
    return { ok: false, error: `unsupported node_type:${n.node_type}` };
  }

  if (typeof n.role_id !== 'string' || !n.role_id.trim()) {
    if (n.node_type === FINAL) {
      const fh = n.config && (n.config.is_final === true || n.config.final_handler === true);
      if (!fh) return { ok: false, error: 'finalization_node requires role_id or config.is_final' };
    } else if (n.node_type === PROMPT) {
      return { ok: false, error: 'prompt_node requires role_id' };
    }
  }

  if (typeof n.task_lane !== 'string' || !n.task_lane.trim()) {
    if (n.node_type === PROMPT) return { ok: false, error: 'prompt_node requires task_lane' };
  }

  if (!n.config || typeof n.config !== 'object') return { ok: false, error: 'node.config object required' };

  if (n.node_type === PROMPT) {
    if (typeof n.config.prompt !== 'string' || !n.config.prompt.trim()) {
      return { ok: false, error: 'prompt_node.config.prompt required' };
    }
  }

  if (n.node_type === MERGE) {
    const ms = n.config.merge_strategy;
    if (!MERGE_STRATEGIES.includes(ms)) {
      return { ok: false, error: `merge_node.config.merge_strategy must be one of:${MERGE_STRATEGIES.join(',')}` };
    }
    if (ms === 'deterministic_priority') {
      const p = n.config.priority;
      if (!Array.isArray(p) || !p.every((x) => typeof x === 'string')) {
        return { ok: false, error: 'merge_node deterministic_priority requires config.priority string[]' };
      }
    }
  }

  if (n.node_type === HUMAN_REVIEW) {
    if (typeof n.config.requested_action !== 'string' || !n.config.requested_action.trim()) {
      return { ok: false, error: 'human_review_node.config.requested_action required' };
    }
  }

  if (n.node_type === TOOL) {
    if (typeof n.config.tool_id !== 'string' || !n.config.tool_id.trim()) {
      return { ok: false, error: 'tool_node.config.tool_id required' };
    }
  }

  if (n.node_type === SUBGRAPH) {
    if (!n.config.subgraph || typeof n.config.subgraph !== 'object') {
      return { ok: false, error: 'subgraph_node.config.subgraph required (inline graph definition)' };
    }
    const sg = n.config.subgraph;
    if (!sg.graph_id || !sg.nodes || !sg.edges || !sg.entry_node_id) {
      return { ok: false, error: 'subgraph_node.config.subgraph must have graph_id, nodes, edges, entry_node_id' };
    }
  }

  if (n.node_type === ROUTER) {
    if (!Array.isArray(n.config.routes) || n.config.routes.length === 0) {
      return { ok: false, error: 'router_node.config.routes[] required (non-empty)' };
    }
    for (const route of n.config.routes) {
      if (typeof route.target_node_id !== 'string') {
        return { ok: false, error: 'router_node route requires target_node_id string' };
      }
    }
  }

  if (n.node_type === MAP_REDUCE) {
    const validReducers = ['concatenate', 'json_array', 'first_valid', 'custom'];
    const strategy = n.config.reducer_strategy || 'json_array';
    if (!validReducers.includes(strategy)) {
      return { ok: false, error: `map_reduce_node.config.reducer_strategy must be one of: ${validReducers.join(',')}` };
    }
    if (strategy === 'custom' && typeof n.config.reducer_expression !== 'string') {
      return { ok: false, error: 'map_reduce_node custom reducer requires config.reducer_expression' };
    }
  }

  return { ok: true };
}

export function graphUsesV3Features(nodes) {
  if (!Array.isArray(nodes)) return false;
  return nodes.some((n) => n && (n.node_type === HUMAN_REVIEW || n.node_type === TOOL));
}

export function graphUsesV4Features(nodes) {
  if (!Array.isArray(nodes)) return false;
  return nodes.some((n) => n && (n.node_type === SUBGRAPH || n.node_type === ROUTER));
}

export function graphUsesV5Features(nodes) {
  if (!Array.isArray(nodes)) return false;
  return nodes.some((n) => n && n.node_type === MAP_REDUCE);
}

export {
  PROMPT as NODE_TYPE_PROMPT,
  MERGE as NODE_TYPE_MERGE,
  FINAL as NODE_TYPE_FINAL,
  HUMAN_REVIEW as NODE_TYPE_HUMAN_REVIEW,
  TOOL as NODE_TYPE_TOOL,
  SUBGRAPH as NODE_TYPE_SUBGRAPH,
  ROUTER as NODE_TYPE_ROUTER,
  MAP_REDUCE as NODE_TYPE_MAP_REDUCE,
  MERGE_STRATEGIES,
  V1_NODE_TYPES,
  V3_NODE_TYPES,
  V4_NODE_TYPES,
  V5_NODE_TYPES,
};
