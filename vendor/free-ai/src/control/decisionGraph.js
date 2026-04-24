import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'evidence', 'decision-graphs');

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

export function writeDecisionGraph(record) {
  ensureDir();
  const graph = {
    schema_version: 'DecisionGraphRecord.v2',
    graph_id: `dg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    generated_at: new Date().toISOString(),
    ...record,
  };
  const file = path.join(DIR, `${graph.graph_id}.json`);
  fs.writeFileSync(file, JSON.stringify(graph, null, 2));

  // Maintain interconnected topology index
  const indexFile = path.join(DIR, `topology_index.json`);
  let index = { edges: [] };
  try { if (fs.existsSync(indexFile)) index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch(e){}
  
  index.edges.push({
    source: graph.prompt_family_id || 'unknown_prompt',
    target: graph.graph_id,
    provider: graph.provider_id,
    valid: graph.validation ? Boolean(graph.validation.valid) : false,
    timestamp: graph.generated_at
  });
  
  // keep last 500 edges in memory map
  if (index.edges.length > 500) index.edges = index.edges.slice(-500);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));

  return graph;
}

export function summarizeDecisionGraphs(limit = 20) {
  ensureDir();
  const indexFile = path.join(DIR, `topology_index.json`);
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json') && f !== 'topology_index.json').sort().reverse().slice(0, limit);
  return files.map((file) => {
    const graph = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
    return {
      graph_id: graph.graph_id,
      trace_id: graph.trace_id,
      prompt_variant: graph.prompt_variant,
      provider_id: graph.provider_id,
      output_contract: graph.output_contract,
      fallback_used: graph.fallback_used,
      generated_at: graph.generated_at,
    };
  });
}
