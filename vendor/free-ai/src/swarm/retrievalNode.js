import { registerTool } from './toolRegistry.js';
import { VectorRetriever } from '../retrieval/vectorRetriever.js';
import { GraphRetriever } from '../retrieval/graphRetriever.js';
import { emitMetric } from '../observability/metrics.js';

export async function executeHybridRetrieval(input) {
  const { query, topK = 3 } = input || {};
  if (!query) return { error: 'query is required' };

  const vectorRetriever = new VectorRetriever();
  const graphRetriever = new GraphRetriever();

  const [vectorResults, graphResults] = await Promise.all([
    vectorRetriever.search(query, topK),
    graphRetriever.search(query)
  ]);

  // Combine and deduplicate
  const resultSets = [...graphResults, ...vectorResults];
  const combinedMap = new Map();
  
  let vectorCount = 0;
  let graphCount = 0;

  resultSets.forEach(res => {
    // avoid duplicates based on source name
    const src = res.metadata.source;
    if (!combinedMap.has(src)) {
      combinedMap.set(src, res);
      if (res.metadata?.method === 'vector') vectorCount++;
      if (res.metadata?.method === 'graph') graphCount++;
    }
  });

  emitMetric('retrieval_relevance_vector', vectorCount, { query_length: query.length });
  emitMetric('retrieval_relevance_graph', graphCount, { query_length: query.length });

  const finalContext = Array.from(combinedMap.values()).map(r => 
    `--- SOURCE: ${r.metadata.source} (${r.metadata.method}) ---\n${r.content}\n`
  ).join('\n');

  return { 
    value: finalContext,
    sources: Array.from(combinedMap.keys()),
    hits: combinedMap.size 
  };
}

// Register as a Swarm tool node capability
registerTool({
  tool_id: 'hybrid_retriever',
  tool_class: 'retrieval_agent',
  description: 'Searches Graph and Vector memory simultaneously for relevant context',
  execute: executeHybridRetrieval
});
