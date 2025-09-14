import * as use from '@tensorflow-models/universal-sentence-encoder';
import '../lib/tensorflow-setup';
import { BartService } from './BartService';

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

class AIServicePrivate {
  private encoder: use.UniversalSentenceEncoder | null = null;
  private bartService: BartService;
  private initializationPromise: Promise<void>;
  private ready = false;

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

  constructor() {
    this.bartService = BartService.getInstance();
    this.initializationPromise = this.initializeModel();
  }

  private async initializeModel(): Promise<void> {
    try {
      this.encoder = await use.load();
      console.log('Universal Sentence Encoder loaded successfully');
      this.ready = true;
    } catch (error) {
      console.error('Failed to load Universal Sentence Encoder:', error);
      this.encoder = null;
      this.ready = false;
    }
  }

  public isReady(): boolean {
    return this.ready;
  }

  async extractTextFromPDF(text: string): Promise<string> {
    // The text is already extracted by PDFProcessor, just return it
    return text;
  }

  async generateSummary(text: string): Promise<string> {
    try {
      // Use BART model for summarization
      return await this.bartService.generateSummary(text);
    } catch (error) {
      console.error('Error in BART summarization, falling back to extractive summarization:', error);
      return this.extractiveSummarization(text);
    }
  }

  private extractiveSummarization(text: string): string {
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
  }

  async classifyDocument(text: string): Promise<ClassificationResult[]> {
    try {
      // Use BART model for classification
      const results = await this.bartService.classify(text, this.labels as unknown as string[]);
      return results;
    } catch (error) {
      console.error('Error in BART classification, falling back to keyword-based classification:', error);
      return this.keywordBasedClassification(text);
    }
  }

  private keywordBasedClassification(text: string): ClassificationResult[] {
    const lowercaseText = text.toLowerCase();
    const scores = new Map<string, number>();

    // Initialize scores
    for (const label of this.labels) {
      scores.set(label, 0);
    }

    // Calculate scores based on keyword matches
    for (const [label, keywords] of Object.entries(this.keywordMap)) {
      const matchCount = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword.toLowerCase(), 'g');
        const matches = lowercaseText.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      scores.set(label, matchCount);
    }

    // Convert to array and normalize scores
    const maxScore = Math.max(...Array.from(scores.values()));
    const results = Array.from(scores.entries()).map(([label, score]) => ({
      label,
      score: maxScore === 0 ? 0 : score / maxScore
    }));

    // Sort by score in descending order
    return results.sort((a, b) => b.score - a.score);
  }
}

// Singleton wrapper
export class AIService {
  classifyDocument(text: string) {
    throw new Error('Method not implemented.');
  }
  private static instance: AIServicePrivate;

  private constructor() {}

  public static getInstance(): AIServicePrivate {
    if (!AIService.instance) {
      AIService.instance = new AIServicePrivate();
    }
    return AIService.instance;
  }
}