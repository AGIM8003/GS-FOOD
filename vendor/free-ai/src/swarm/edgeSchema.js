const VALID_EDGE_TYPES = ['default', 'conditional'];

/**
 * @param {unknown} e
 * @param {{ allowV4?: boolean }} [opts]
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateEdgeV1(e, opts) {
  if (!e || typeof e !== 'object') return { ok: false, error: 'edge must be object' };
  if (typeof e.from_node_id !== 'string' || !e.from_node_id.trim()) {
    return { ok: false, error: 'edge.from_node_id required' };
  }
  if (typeof e.to_node_id !== 'string' || !e.to_node_id.trim()) {
    return { ok: false, error: 'edge.to_node_id required' };
  }
  if (e.from_node_id === e.to_node_id) return { ok: false, error: 'edge self-loop' };

  if (opts?.allowV4 && e.edge_type) {
    if (!VALID_EDGE_TYPES.includes(e.edge_type)) {
      return { ok: false, error: `unsupported edge_type:${e.edge_type}` };
    }
    if (e.edge_type === 'conditional') {
      if (typeof e.condition !== 'string' || !e.condition.trim()) {
        return { ok: false, error: 'conditional edge requires condition string' };
      }
    }
  }
  return { ok: true };
}

export function edgeIsConditional(e) {
  return e && e.edge_type === 'conditional' && typeof e.condition === 'string';
}

export function graphUsesConditionalEdges(edges) {
  if (!Array.isArray(edges)) return false;
  return edges.some((e) => edgeIsConditional(e));
}

export { VALID_EDGE_TYPES };
