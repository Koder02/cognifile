export interface SearchResult {
  id: string;
  name: string;
  category: string;
  confidence: number;
  relevanceScore: number;
  snippet: string;
  path: string;
}

export class SearchService {
  private static instance: SearchService;
  private documents: Array<{
    id: string;
    name: string;
    text: string;
    category: string;
    confidence: number;
    path: string;
  }> = [];
  private remoteUrl = 'http://localhost:8001';

  private constructor() {}

  public static getInstance(): SearchService {
    if (!this.instance) {
      this.instance = new SearchService();
    }
    return this.instance;
  }

  public addDocument(doc: {
    id: string;
    name: string;
    text: string;
    category: string;
    confidence: number;
    path: string;
  }) {
    this.documents.push(doc);
  }

  public addDocuments(docs: Array<{
    id: string;
    name: string;
    text: string;
    category: string;
    confidence: number;
    path: string;
  }>) {
    this.documents.push(...docs);
    // Attempt to index remotely (non-blocking)
    this.remoteIndex(docs).catch(err => {
      console.warn('Remote index failed, continuing with in-memory index:', err);
    });
  }

  private async remoteIndex(docs: any[]) {
    try {
      // Send richer metadata for better search ranking: include name/title, snippet (text), path, and category
      const payload = docs.map(d => ({
        id: d.id,
        text: d.text,
        name: d.name,
        path: d.path,
        meta: {
          category: d.category,
          confidence: d.confidence,
          title: d.name,
        }
      }));

      const res = await fetch(`${this.remoteUrl}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Remote index error: ${res.status} ${res.statusText} ${text}`);
      }
      return await res.json();
    } catch (e) {
      throw e;
    }
  }

  private getRelevanceScore(text: string, query: string): number {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const words = normalizedQuery.split(' ');
    
    let score = 0;
    words.forEach(word => {
      const regex = new RegExp(word, 'gi');
      const matches = normalizedText.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    
    return score;
  }

  private getSnippet(text: string, query: string, length: number = 200): string {
    const normalizedText = text.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) {
      return text.substring(0, length) + '...';
    }
    
    const start = Math.max(0, index - length / 2);
    const end = Math.min(text.length, index + length / 2);
    
    return (start > 0 ? '...' : '') +
           text.substring(start, end).trim() +
           (end < text.length ? '...' : '');
  }

  public search(query: string, filters?: { category?: string }): SearchResult[] {
    // Try remote semantic search first (synchronous API not available here), so fallback to in-memory ranking
    let results = this.documents
      .filter(doc => {
        if (filters?.category && doc.category !== filters.category) {
          return false;
        }
        return true;
      })
      .map(doc => {
        const relevanceScore = this.getRelevanceScore(doc.text, query);
        return {
          id: doc.id,
          name: doc.name,
          category: doc.category,
          confidence: doc.confidence,
          relevanceScore,
          snippet: this.getSnippet(doc.text, query),
          path: doc.path
        };
      })
      .filter(result => result.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results;
  }

  // Async remote search method that returns promise of results using the FAISS microservice
  public async semanticSearch(query: string, top_k: number = 5): Promise<SearchResult[]> {
    try {
      const res = await fetch(`${this.remoteUrl}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, top_k })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Remote search failed: ${res.status} ${res.statusText} ${txt}`);
      }
      const data = await res.json();
      const results: SearchResult[] = (data.results || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        category: r.meta?.category || 'Unknown',
        confidence: r.score,
        relevanceScore: r.score,
        snippet: '',
        path: r.path
      }));
      return results;
    } catch (err) {
      console.warn('Semantic search remote failed, falling back to local search:', err);
      return Promise.resolve(this.search(query));
    }
  }

  public clear() {
    this.documents = [];
  }
}
