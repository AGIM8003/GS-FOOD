import { writeMemory } from '../src/memory/vault.js';
import { summarizeGraph } from '../src/memory/graph.js';

await writeMemory({ category: 'test', subject: 'graph subject', summary: 'graph summary', confidence: 0.8, importance: 0.7 });
const summary = await summarizeGraph();
if (!summary || summary.node_count < 1 || summary.edge_count < 1) {
  console.error('memory graph summary invalid');
  process.exit(2);
}

console.log('memory_graph test OK');
