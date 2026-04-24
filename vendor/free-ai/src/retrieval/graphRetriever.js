import fs from 'fs';
import path from 'path';

/**
 * Basic relational mapping over Obsidian markdown links.
 * Looks for [[WikiLinks]] to draw edges between stored memory files.
 */
export class GraphRetriever {
  constructor(baseDir) {
    this.baseDir = baseDir || path.join(process.cwd(), 'data', 'memory', 'obsidian', 'long_term');
  }

  // Parses [[Link Name]] from raw text
  _extractLinks(text) {
    const linkRegex = /\[\[(.*?)\]\]/g;
    const links = [];
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
      links.push(match[1]);
    }
    return links;
  }

  // Pre-load and build graph
  _buildGraph() {
    if (!fs.existsSync(this.baseDir)) return { nodes: {}, edges: {} };
    
    const nodes = {};
    const edges = {}; // adjacency list

    const files = fs.readdirSync(this.baseDir).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      const filePath = path.join(this.baseDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const baseName = file.replace('.md', '');
      
      nodes[baseName] = content;
      edges[baseName] = this._extractLinks(content);
    });

    return { nodes, edges };
  }

  /**
   * Search graph starting from nodes directly matching the query, 
   * and expands 1 hop outward.
   * @param {string} query 
   */
  async search(query) {
    const graph = this._buildGraph();
    const queryTerms = query.toLowerCase().match(/[a-z0-9]+/g) || [];
    
    if (!queryTerms.length) return [];

    // Find seed nodes
    const seeds = Object.keys(graph.nodes).filter(nodeName => {
      return queryTerms.some(term => nodeName.toLowerCase().includes(term));
    });

    const contextSet = new Set();
    const results = [];

    // Process seeds and their 1-hop neighbors
    seeds.forEach(seed => {
      if (!contextSet.has(seed)) {
        contextSet.add(seed);
        results.push({
          content: graph.nodes[seed],
          metadata: { source: seed, method: 'graph_seed' }
        });
      }
      
      // Follow edges 1 hop
      const outgoingEdges = graph.edges[seed] || [];
      outgoingEdges.forEach(target => {
        const safeTarget = target.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        if (graph.nodes[safeTarget] && !contextSet.has(safeTarget)) {
          contextSet.add(safeTarget);
          results.push({
            content: graph.nodes[safeTarget],
            metadata: { source: safeTarget, method: 'graph_hop_1', from: seed }
          });
        }
      });
    });

    return results;
  }
}
