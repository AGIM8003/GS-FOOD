import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'evidence', 'decision-graphs');

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

export function writeDecisionGraph(record) {
  ensureDir();
  const graph = {
    schema_version: 'DecisionGraphRecord.v1',
    graph_id: `dg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    generated_at: new Date().toISOString(),
    ...record,
  };
  const file = path.join(DIR, `${graph.graph_id}.json`);
  fs.writeFileSync(file, JSON.stringify(graph, null, 2));
  return graph;
}

export function summarizeDecisionGraphs(limit = 20) {
  ensureDir();
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort().reverse().slice(0, limit);
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
