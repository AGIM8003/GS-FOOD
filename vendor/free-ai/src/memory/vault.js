import fs from 'fs/promises';
import { join } from 'path';
import { addGraphEdge, summarizeGraph, upsertGraphNode } from './graph.js';

import os from 'os';

const BASE_MEM_DIR = join(os.homedir(), '.gemini', 'antigravity', 'memory');
const VAULT = join(BASE_MEM_DIR, 'vault');
const INDEX = join(BASE_MEM_DIR, 'index.json');
const EDGES = join(BASE_MEM_DIR, 'edges');

async function ensure(){
  await fs.mkdir(VAULT, { recursive: true });
  await fs.mkdir(EDGES, { recursive: true });
  try{ await fs.access(INDEX); }catch(e){ await fs.writeFile(INDEX, JSON.stringify([]),'utf8'); }
}

export async function writeMemory(mem){
  await ensure();
  const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2,6)}`;
  // Tier Enforcement
  const tier = mem.write_tier || 'tier1';
  if (tier === 'tier3' && !mem.confirmed_by_user) {
    throw new Error('Tier 3 persistence blocked: User confirmation required for identity memory.');
  }
  if (tier === 'tier2' && (mem.confidence || 0.6) < 0.75) {
    throw new Error('Tier 2 persistence blocked: Evidence confidence threshold not met.');
  }

  const record = {
    memory_id: id,
    user_id: mem.user_id || 'anonymous',
    category: mem.category || 'general',
    subject: mem.subject || (mem.summary||'').slice(0,80),
    summary: mem.summary || '',
    structured_payload: mem.structured_payload || null,
    source_trace_id: mem.source_trace_id || null,
    source_receipt_id: mem.source_receipt_id || null,
    confidence: mem.confidence || 0.6,
    importance: mem.importance || 0.5,
    retention_class: mem.retention_class || 'medium',
    version: mem.version || 'v1',
    memory_origin: mem.memory_origin || 'system',
    sensitivity_class: mem.sensitivity_class || 'normal',
    provenance: mem.provenance || null,
    write_tier: tier,
    confirmed_by_user: mem.confirmed_by_user || false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await fs.writeFile(join(VAULT, `${id}.json`), JSON.stringify(record,null,2),'utf8');
  const idx = JSON.parse(await fs.readFile(INDEX,'utf8'));
  idx.push({ memory_id: id, category: record.category, subject: record.subject, created_at: record.created_at, importance: record.importance, write_tier: record.write_tier });
  await fs.writeFile(INDEX, JSON.stringify(idx,null,2),'utf8');
  await upsertGraphNode({
    node_id: id,
    type: 'memory',
    key: record.subject,
    label: record.subject,
    importance: record.importance,
    confidence: record.confidence,
    provenance: record.provenance,
    meta: { category: record.category, retention_class: record.retention_class },
  }).catch(() => null);
  if (record.user_id !== 'anonymous') {
    const userNode = await upsertGraphNode({
      type: 'identity',
      key: `user-${record.user_id}`,
      label: `User ${record.user_id}`
    }).catch(() => null);
    if (userNode) {
      await addGraphEdge({ from: id, to: userNode.node_id, relation: 'belongs_to', provenance: record.provenance, confidence: record.confidence }).catch(() => null);
    }
  }

  if (record.subject) {
    const subjectNode = await upsertGraphNode({
      type: 'subject',
      key: record.subject,
      label: record.subject,
      meta: { category: record.category },
    }).catch(() => null);
    if (subjectNode) {
      await addGraphEdge({ from: id, to: subjectNode.node_id, relation: 'about', provenance: record.provenance, confidence: record.confidence }).catch(() => null);
      if (record.user_id !== 'anonymous') {
         await addGraphEdge({ from: `user-${record.user_id}`, to: subjectNode.node_id, relation: 'has_trait', provenance: record.provenance, confidence: record.confidence }).catch(() => null);
      }
    }
  }
  return record;
}

export async function linkMemory(fromId, toId, relation='related'){
  await ensure();
  const e = { from: fromId, to: toId, relation, created_at: new Date().toISOString() };
  const path = join(EDGES, `${fromId}_to_${toId}.json`);
  await fs.writeFile(path, JSON.stringify(e,null,2),'utf8');
  await addGraphEdge({ from: fromId, to: toId, relation }).catch(() => null);
}

export async function queryMemory({ subject=null, category=null, limit=5 }){
  await ensure();
  const idx = JSON.parse(await fs.readFile(INDEX,'utf8'));
  let out = idx;
  if (subject) out = out.filter(i=> (i.subject||'').toLowerCase().includes(subject.toLowerCase()));
  if (category) out = out.filter(i=> i.category===category);
  out = out.slice(-limit).reverse();
  const results = [];
  for (const i of out) {
    try{ const t = await fs.readFile(join(VAULT, `${i.memory_id}.json`),'utf8'); results.push(JSON.parse(t)); }catch(e){}
  }
  return results;
}

export async function compactMemories(){
  // naive compaction: summarize old low-importance memories (placeholder)
  await ensure();
  const idx = JSON.parse(await fs.readFile(INDEX,'utf8'));
  const old = idx.filter(i=> i.importance < 0.3);
  const graph = await summarizeGraph().catch(() => null);
  return { compacted: old.length, graph };
}
