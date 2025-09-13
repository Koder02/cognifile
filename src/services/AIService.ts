import * as use from '@tensorflow-models/universal-sentence-encoder';
import { pdfjsLib } from '../lib/pdfjs-worker';
import '../lib/tensorflow-setup';

export interface ClassificationResult {
  label: string;
  score: number;
}

export interface SearchResult {
  documentId: string;
  score: number;
}

interface TextContentItem {
  str: string;
}

type EmbeddingArray = number[][];

export class AIService {
  private static instance: AIService;
  private encoder: use.UniversalSentenceEncoder | null = null;
  private labels = [
    'Finance',
    'HR',
    'Legal',
    'Contracts',
    'Technical Reports',
    'Other'
  ] as const;

  // Simple keyword map for fallback classification when the encoder/model is unavailable
  private keywordMap: Record<string, string[]> = {
    Finance: ['invoice', 'payment', 'amount', 'balance', 'revenue', 'expenses', 'financial', 'statement', 'budget', 'tax'],
    HR: ['employee', 'hiring', 'onboarding', 'hr', 'benefits', 'payroll', 'termination', 'performance review'],
    Legal: ['legal', 'lawsuit', 'plaintiff', 'defendant', 'court', 'judgment', 'statute', 'attorney', 'litigation'],
    Contracts: ['agreement', 'contract', 'term', 'party', 'warranty', 'hereinafter', 'whereas', 'signature'],
    'Technical Reports': ['abstract', 'methodology', 'experiment', 'results', 'implementation', 'technical', 'dataset', 'analysis'],
    Other: []
  };

  async generateSummary(text: string): Promise<string> {
    try {
      // Extractive TF-like scoring: compute word frequencies (TF), score sentences by sum of word frequencies,
      // then pick top 3 sentences preserving original order.
      if (!text || text.trim().length === 0) return 'No text available to summarize.';

      // Split into sentences
      const rawSentences = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);

      if (rawSentences.length === 0) return text.slice(0, 300) + (text.length > 300 ? '...' : '');

      // Tokenize and compute word frequencies excluding stop words
      const stopwords = new Set(['the','and','is','in','at','of','a','an','to','for','by','on','with','that','this','as','are','be','or']);
      const freq: Record<string, number> = {};
      for (const s of rawSentences) {
        const tokens = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t && !stopwords.has(t));
        for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
      }

      // Score sentences
      const sentenceScores = rawSentences.map(s => {
        const tokens = s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(t => t && !stopwords.has(t));
        const score = tokens.reduce((sum, t) => sum + (freq[t] || 0), 0) / Math.sqrt(tokens.length || 1);
        return { s, score };
      });

      // Pick top 3-5 sentences
      const topCount = Math.min(5, Math.max(3, Math.ceil(rawSentences.length * 0.2)));
      const picked = sentenceScores
        .slice()
        .sort((a,b) => b.score - a.score)
        .slice(0, topCount)
        .map(x => x.s);

      // Preserve original order
      const summarySentences = rawSentences.filter(s => picked.includes(s)).slice(0, topCount);
      return summarySentences.join(' ');
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Unable to generate summary.';
    }
  }

  private initializationPromise: Promise<void>;

  private constructor() {
    this.initializationPromise = this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      this.encoder = await use.load();
      console.log('Universal Sentence Encoder loaded successfully');
    } catch (error) {
      // Log the error but do not throw so the app can continue to function.
      // Typical causes: offline, model CDN blocked, or network issues.
      console.error('Error loading Universal Sentence Encoder model (continuing without encoder):', error);
      this.encoder = null;
    }
  }

  static getInstance = () => {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  };

  // Whether the encoder model is available and ready
  isReady = async (): Promise<boolean> => {
    try {
      await this.initializationPromise;
    } catch (_e) {
      // initializationPromise will not throw since we catch inside initializeModel(),
      // but keep guard for future changes.
    }
    return this.encoder !== null;
  };

  extractTextFromPDF = async (pdfPath: string): Promise<string> => {
    try {
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;
      let text = '';
      
      const numPages = Math.min(pdf.numPages, 2);
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const items = content.items as TextContentItem[];
        text += items.map(item => item.str).join(' ');
      }
      
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  };

  private getEmbeddings = async (texts: string[]): Promise<EmbeddingArray> => {
    await this.initializationPromise;
    if (!this.encoder) {
      // Encoder isn't available (network/model fetch failed). Return zeroed embeddings
      // so downstream code can still run without throwing.
      console.warn('Encoder unavailable; returning zero embeddings as fallback.');
      return texts.map(() => Array(512).fill(0));
    }
    const embeddings = await this.encoder.embed(texts);
    return embeddings.arraySync() as EmbeddingArray;
  };

  classifyDocument = async (text: string): Promise<ClassificationResult[]> => {
    try {
      const ready = await this.isReady();
      if (!ready) {
        // Use lightweight keyword-based fallback classification
        return this.fallbackClassify(text);
      }

      const labelDescriptions = this.labels.map(label => 
        `This is a ${label.toLowerCase()} document.`
      );
      const allTexts = [text, ...labelDescriptions];

      const embeddings = await this.getEmbeddings(allTexts);
      const documentEmbedding = embeddings[0];
      const labelEmbeddings = embeddings.slice(1);

      const scores = labelEmbeddings.map(labelEmb => 
        this.cosineSimilarity(documentEmbedding, labelEmb)
      );

      return this.labels
        .map((label, i) => ({ label, score: scores[i] }))
        .sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error classifying document:', error);
      return [{ label: 'Other', score: 0 }];
    }
  };

  // Fallback classifier: simple keyword matching with normalized scores
  private fallbackClassify(text: string): ClassificationResult[] {
    const lower = (text || '').toLowerCase();
    const scores: Record<string, number> = {};
    for (const label of this.labels) {
      const kws = this.keywordMap[label];
      let count = 0;
      for (const kw of kws) {
        if (lower.includes(kw)) count += 1;
      }
      scores[label] = count;
    }

    // Normalize counts to a 0..1 score
    const max = Math.max(...Object.values(scores), 0);
    const results: ClassificationResult[] = this.labels.map(label => ({
      label,
      score: max > 0 ? scores[label] / max : 0
    }));

    // If no keywords matched, prefer 'Other'
    if (max === 0) {
      return [{ label: 'Other', score: 1 } as ClassificationResult];
    }

    return results.sort((a, b) => b.score - a.score);
  }

  searchDocuments = async (
    query: string, 
    documents: { id: string; text: string; }[]
  ): Promise<SearchResult[]> => {
    try {
      const allTexts = [query, ...documents.map(d => d.text)];
      const embeddings = await this.getEmbeddings(allTexts);
      
      const queryEmbedding = embeddings[0];
      const docEmbeddings = embeddings.slice(1);

      const results = documents.map((doc, i) => ({
        documentId: doc.id,
        score: this.cosineSimilarity(queryEmbedding, docEmbeddings[i])
      }));

      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error searching documents:', error);
      return [];
    }
  };

  private cosineSimilarity = (a: number[], b: number[]): number => {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  };
}
