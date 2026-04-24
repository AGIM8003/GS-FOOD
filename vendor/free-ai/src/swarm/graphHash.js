import crypto from 'crypto';

/**
 * @param {{ nodes: object[], edges: object[] }} graph
 * @returns {string}
 */
export function computeGraphHashV1(graph) {
  const nodes = [...(graph.nodes || [])].sort((a, b) => String(a.node_id).localeCompare(String(b.node_id)));
  const edges = [...(graph.edges || [])].sort(
    (a, b) => `${a.from_node_id}->${a.to_node_id}`.localeCompare(`${b.from_node_id}->${b.to_node_id}`),
  );
  const canonical = { nodes, edges };
  return crypto.createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
