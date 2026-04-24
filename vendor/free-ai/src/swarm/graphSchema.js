import { validateEdgeV1, graphUsesConditionalEdges } from './edgeSchema.js';
import {
  validateNodeV1,
  NODE_TYPE_PROMPT,
  NODE_TYPE_MERGE,
  NODE_TYPE_FINAL,
  NODE_TYPE_HUMAN_REVIEW,
  NODE_TYPE_TOOL,
  NODE_TYPE_SUBGRAPH,
  NODE_TYPE_ROUTER,
  NODE_TYPE_MAP_REDUCE,
  graphUsesV3Features,
  graphUsesV4Features,
  graphUsesV5Features,
} from './nodeSchema.js';

const DEFAULT_MAX_FAN_OUT = 2;
const MAX_FAN_OUT_CEILING = 16;
const DEFAULT_MAX_ITERATIONS = 50;

function resolveMaxFanOut(body) {
  if (typeof body.max_fan_out === 'number' && body.max_fan_out >= 1) {
    return Math.min(body.max_fan_out, MAX_FAN_OUT_CEILING);
  }
  const env = parseInt(process.env.FREEAI_MAX_FAN_OUT, 10);
  if (env >= 1) return Math.min(env, MAX_FAN_OUT_CEILING);
  return DEFAULT_MAX_FAN_OUT;
}

/**
 * @param {unknown} body
 * @returns {{ ok: true, graph: object, schema_version: string } | { ok: false, errors: string[] }}
 */
export function validateSwarmGraphV1(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['body must be object'] };
  }
  const {
    graph_id,
    graph_name,
    nodes,
    edges,
    entry_node_id,
    receipt_mode,
    input_payload,
    graph_schema_version,
  } = body;
  if (typeof graph_id !== 'string' || !graph_id.trim()) errors.push('graph_id required');
  if (typeof graph_name !== 'string' || !graph_name.trim()) errors.push('graph_name required');
  if (!Array.isArray(nodes) || nodes.length === 0) errors.push('nodes[] required');
  if (!Array.isArray(edges)) errors.push('edges[] required');
  if (typeof entry_node_id !== 'string' || !entry_node_id.trim()) errors.push('entry_node_id required');
  if (typeof receipt_mode !== 'string' || !receipt_mode.trim()) errors.push('receipt_mode required');
  if (input_payload === undefined || input_payload === null || typeof input_payload !== 'object') {
    errors.push('input_payload must be object');
  }
  if (errors.length) return { ok: false, errors };

  const isV5Explicit = graph_schema_version === 'v5';
  const isV5Auto = graphUsesV5Features(nodes);
  const useV5 = isV5Explicit || isV5Auto;

  const isV4Explicit = graph_schema_version === 'v4';
  const isV4Auto = graphUsesV4Features(nodes) || graphUsesConditionalEdges(edges);
  const useV4 = useV5 || isV4Explicit || isV4Auto;

  const isV3Explicit = graph_schema_version === 'v3';
  const isV3Auto = graphUsesV3Features(nodes);
  const useV3 = useV4 || isV3Explicit || isV3Auto;

  const schema_version = useV5 ? 'v5' : useV4 ? 'v4' : useV3 ? 'v3' : 'v1';

  const maxFanOut = resolveMaxFanOut(body);
  const allowCycles = useV4 && body.allow_cycles === true;
  const maxIterations = (typeof body.max_iterations === 'number' && body.max_iterations >= 1)
    ? Math.min(body.max_iterations, 200)
    : DEFAULT_MAX_ITERATIONS;

  const idSet = new Set();
  for (const n of nodes) {
    if (idSet.has(n.node_id)) {
      errors.push(`duplicate node_id:${n.node_id}`);
    }
    idSet.add(n.node_id);
    const vr = validateNodeV1(n, { allowV3: useV3, allowV4: useV4, allowV5: useV5 });
    if (!vr.ok) errors.push(vr.error);
  }
  for (const e of edges) {
    const er = validateEdgeV1(e, { allowV4: useV4 });
    if (!er.ok) errors.push(er.error);
    if (er.ok && (!idSet.has(e.from_node_id) || !idSet.has(e.to_node_id))) {
      errors.push(`edge references missing node:${e.from_node_id}->${e.to_node_id}`);
    }
  }

  const byId = new Map(nodes.map((n) => [n.node_id, n]));
  if (!byId.has(entry_node_id)) errors.push('entry_node_id not found in nodes');

  let promptCount = 0;
  let mergeCount = 0;
  let finalCount = 0;
  for (const n of nodes) {
    if (n.node_type === NODE_TYPE_PROMPT) promptCount += 1;
    if (n.node_type === NODE_TYPE_MERGE) mergeCount += 1;
    if (n.node_type === NODE_TYPE_FINAL) finalCount += 1;
  }
  if (promptCount > 3) errors.push('max 3 prompt_node');
  if (promptCount < 1) errors.push('at least 1 prompt_node required');
  if (mergeCount !== 1) errors.push('exactly 1 merge_node required');
  if (finalCount !== 1) errors.push('exactly 1 finalization_node required');

  const out = new Map();
  const inc = new Map();
  for (const n of nodes) {
    out.set(n.node_id, []);
    inc.set(n.node_id, []);
  }
  for (const e of edges) {
    if (!idSet.has(e.from_node_id) || !idSet.has(e.to_node_id)) continue;
    out.get(e.from_node_id).push(e.to_node_id);
    inc.get(e.to_node_id).push(e.from_node_id);
  }
  for (const [nid, outs] of out) {
    if (outs.length > maxFanOut) errors.push(`fan-out >${maxFanOut} from node:${nid}`);
  }

  if (byId.get(entry_node_id)?.node_type !== NODE_TYPE_PROMPT) {
    errors.push('entry_node must be prompt_node');
  }

  if (!allowCycles && hasCycle(nodes, edges)) errors.push('cycle detected');

  if (allowCycles && !hasCycle(nodes, edges)) {
    /* graph declared allow_cycles but has no cycles - fine, treat as DAG */
  }

  const finalNode = nodes.find((n) => n.node_type === NODE_TYPE_FINAL);
  if (finalNode) {
    const finalPreds = inc.get(finalNode.node_id) || [];
    if (finalPreds.length > 1) {
      errors.push('finalization_node must have at most 1 predecessor');
    }
    if (!reachable(entry_node_id, finalNode.node_id, out)) {
      errors.push('no path from entry to finalization_node');
    }
  }

  const reachableFromEntry = collectReachable(entry_node_id, out);
  for (const n of nodes) {
    if (!reachableFromEntry.has(n.node_id)) {
      errors.push(`node not reachable from entry:${n.node_id}`);
    }
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    graph: body,
    schema_version,
    resolved_max_fan_out: maxFanOut,
    allow_cycles: allowCycles,
    max_iterations: maxIterations,
  };
}

export { DEFAULT_MAX_FAN_OUT, MAX_FAN_OUT_CEILING, DEFAULT_MAX_ITERATIONS };

function collectReachable(start, outAdj) {
  const q = [start];
  const seen = new Set(q);
  while (q.length) {
    const u = q.shift();
    for (const v of outAdj.get(u) || []) {
      if (!seen.has(v)) {
        seen.add(v);
        q.push(v);
      }
    }
  }
  return seen;
}

function hasCycle(nodes, edges) {
  const ids = new Set(nodes.map((n) => n.node_id));
  const adj = new Map(nodes.map((n) => [n.node_id, []]));
  for (const e of edges) {
    if (!ids.has(e.from_node_id) || !ids.has(e.to_node_id)) continue;
    adj.get(e.from_node_id).push(e.to_node_id);
  }
  const state = new Map(nodes.map((n) => [n.node_id, 0]));
  function dfs(u) {
    state.set(u, 1);
    for (const v of adj.get(u) || []) {
      if (state.get(v) === 1) return true;
      if (state.get(v) === 0 && dfs(v)) return true;
    }
    state.set(u, 2);
    return false;
  }
  for (const n of nodes) {
    if (state.get(n.node_id) === 0 && dfs(n.node_id)) return true;
  }
  return false;
}

function reachable(start, target, outAdj) {
  const q = [start];
  const seen = new Set(q);
  while (q.length) {
    const u = q.shift();
    if (u === target) return true;
    for (const v of outAdj.get(u) || []) {
      if (!seen.has(v)) {
        seen.add(v);
        q.push(v);
      }
    }
  }
  return false;
}
