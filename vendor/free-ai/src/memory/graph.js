import fs from 'fs/promises';
import fsSync from 'fs';
import { join } from 'path';

const GRAPH_DIR = join(process.cwd(), 'memory', 'graph');
const NODES = join(GRAPH_DIR, 'nodes.json');
const EDGES = join(GRAPH_DIR, 'edges.json');
const SNAPSHOTS = join(process.cwd(), 'memory', 'snapshots');

async function ensure() {
  await fs.mkdir(GRAPH_DIR, { recursive: true });
  await fs.mkdir(SNAPSHOTS, { recursive: true });
  try { await fs.access(NODES); } catch { await fs.writeFile(NODES, '[]', 'utf8'); }
  try { await fs.access(EDGES); } catch { await fs.writeFile(EDGES, '[]', 'utf8'); }
}

async function readJson(file, fallback = []) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return fallback; }
}

async function writeJson(file, value) {
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

export async function upsertGraphNode(node) {
  await ensure();
  const nodes = await readJson(NODES, []);
  const nodeId = node.node_id || `${node.type || 'node'}-${(node.key || node.label || 'unknown').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const existing = nodes.findIndex((n) => n.node_id === nodeId);
  const record = {
    node_id: nodeId,
    type: node.type || 'generic',
    key: node.key || node.label || nodeId,
    label: node.label || node.key || nodeId,
    tags: node.tags || [],
    provenance: node.provenance || null,
    confidence: node.confidence ?? 0.7,
    importance: node.importance ?? 0.5,
    updated_at: new Date().toISOString(),
    created_at: existing >= 0 ? nodes[existing].created_at : new Date().toISOString(),
    meta: { ...(existing >= 0 ? nodes[existing].meta : {}), ...(node.meta || {}) },
  };
  if (existing >= 0) nodes[existing] = record; else nodes.push(record);
  await writeJson(NODES, nodes);
  return record;
}

export async function addGraphEdge(edge) {
  await ensure();
  const edges = await readJson(EDGES, []);
  const record = {
    edge_id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from: edge.from,
    to: edge.to,
    relation: edge.relation || 'related',
    provenance: edge.provenance || null,
    confidence: edge.confidence ?? 0.7,
    created_at: new Date().toISOString(),
  };
  edges.push(record);
  await writeJson(EDGES, edges);
  return record;
}

export async function summarizeGraph() {
  await ensure();
  const nodes = await readJson(NODES, []);
  const edges = await readJson(EDGES, []);
  
  // Build a summary of identities and their traits
  const identities = nodes.filter(n => n.type === 'identity');
  const user_profiles = identities.map(user => {
      const userTraits = edges.filter(e => e.from === user.node_id && e.relation === 'has_trait').map(e => e.to);
      return { user_id: user.node_id, traits_inferred: userTraits.length, trait_keys: nodes.filter(n => userTraits.includes(n.node_id)).map(n => n.label) };
  });

  const summary = {
    generated_at: new Date().toISOString(),
    node_count: nodes.length,
    edge_count: edges.length,
    node_types: [...new Set(nodes.map((n) => n.type))].sort(),
    active_users: user_profiles.length,
    user_topologies: user_profiles
  };
  await fs.writeFile(join(SNAPSHOTS, `graph-summary-${Date.now()}.json`), JSON.stringify(summary, null, 2), 'utf8');
  return summary;
}
