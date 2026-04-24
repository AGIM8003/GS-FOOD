import fs from 'fs';
import path from 'path';

/**
 * Mock representation of dense vector retrieval. 
 * Since real dense retrieval requires an embedding model endpoint 
 * which costs money or setup, this serves as a structural scaffold that uses
 * lexical keyword intersection as a pseudo-embedding stand-in.
 * 
 * In a real environment, this gets hooked to Voyage AI or OpenAI embeddings.
 */
export class VectorRetriever {
  constructor(baseDir) {
    this.baseDir = baseDir || path.join(process.cwd(), 'data', 'memory', 'obsidian', 'long_term');
  }

  // Pre-load all available markdown memory files
  _loadAllMemories() {
    if (!fs.existsSync(this.baseDir)) return [];
    
    return fs.readdirSync(this.baseDir)
      .filter(f => f.endsWith('.md'))
      .map(file => {
        const filePath = path.join(this.baseDir, file);
        return {
          id: file,
          content: fs.readFileSync(filePath, 'utf8')
        };
      });
  }

  // Pseudo cosine similarity based on tf-idf like keyword overlap
  _scoreSimilarity(query, text) {
    const queryTerms = query.toLowerCase().match(/[a-z0-9]+/g) || [];
    const textTerms = text.toLowerCase().match(/[a-z0-9]+/g) || [];
    if (!queryTerms.length || !textTerms.length) return 0;

    const textTermSet = new Set(textTerms);
    let matchCount = 0;
    
    queryTerms.forEach(term => {
      // Basic stopword exclusion could go here
      if (textTermSet.has(term)) matchCount++;
    });

    return matchCount / queryTerms.length; // 0 to 1 score
  }

  /**
   * Search dense dimension
   * @param {string} query 
   * @param {number} topK 
   */
  async search(query, topK = 3) {
    const docs = this._loadAllMemories();
    const scoredDocs = docs.map(doc => {
      return {
        ...doc,
        score: this._scoreSimilarity(query, doc.content)
      };
    }).filter(doc => doc.score > 0);

    return scoredDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(doc => ({
        content: doc.content,
        metadata: { source: doc.id, method: 'vector_mock' },
        score: doc.score
      }));
  }
}
