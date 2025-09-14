import { BartService } from './BartService';

export interface ClassificationResult {
  label: string;
  score: number;
}

export interface SearchResult {
  documentId: string;
  score: number;
}

export class AIService {
  private static instance: AIService;
  private bartService: BartService;
  private ready = true; // Always ready since we're using BART

  private labels = [
    'Finance',
    'HR',
    'Legal',
    'Contracts',
    'Tech',
    'Other'
  ] as const;

  // Simple keyword map for fallback classification when BART is unavailable
  private categoryIndicators: Record<string, { strong: string[], normal: string[], weak: string[] }> = {
    Finance: {
      strong: ['financial statements', 'balance sheet', 'income statement', 'cash flow', 'quarterly report', 'profit and loss'],
      normal: ['revenue', 'expenses', 'budget', 'tax', 'audit', 'investment', 'fiscal', 'monetary'],
      weak: ['total', 'payment', 'cost', 'price', 'amount']
    },
    HR: {
      strong: ['employment contract', 'performance evaluation', 'personnel record', 'disciplinary action', 'hr policy'],
      normal: ['employee', 'recruitment', 'onboarding', 'benefits', 'payroll', 'termination'],
      weak: ['training', 'staff', 'team', 'workplace']
    },
    Legal: {
      strong: ['court filing', 'legal proceeding', 'statutory requirement', 'pursuant to', 'jurisdiction'],
      normal: ['lawsuit', 'plaintiff', 'defendant', 'attorney', 'litigation', 'statute', 'compliance'],
      weak: ['agreement', 'policy', 'rights', 'terms']
    },
    Contracts: {
      strong: ['parties hereby agree', 'terms and conditions', 'binding agreement', 'contractual obligation'],
      normal: ['contract', 'agreement', 'warranty', 'term', 'clause', 'signature'],
      weak: ['party', 'service', 'product', 'provide']
    },
    'Tech': {
      strong: ['technical specification', 'system architecture', 'api reference', 'source code', 'implementation details'],
      normal: ['algorithm', 'software', 'database', 'framework', 'protocol', 'computation'],
      weak: ['process', 'system', 'analysis', 'data']
    },
    Other: {
      strong: [],
      normal: ['general', 'miscellaneous'],
      weak: ['other', 'unknown']
    }
  };

  private constructor() {
    this.bartService = BartService.getInstance();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  public isReady(): boolean {
    return this.ready;
  }

  async extractTextFromPDF(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new Error('No text content provided');
    }
    return text.trim();
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

  async classifyDocument(text: string): Promise<ClassificationResult[]> {
    if (!text || text.trim().length === 0) {
      return [{ label: 'Other', score: 1 }];
    }

    // Start with weighted classification as a fallback
    const scores = new Map<string, number>();
    const textLower = text.toLowerCase();
    
    for (const [category, indicators] of Object.entries(this.categoryIndicators)) {
      let score = 0;
      let totalWeight = 0;
      
      // Check strong indicators (3.0 weight)
      for (const phrase of indicators.strong) {
        if (textLower.includes(phrase.toLowerCase())) {
          score += 3.0;
        }
        totalWeight += 3.0;
      }
      
      // Check normal indicators (1.0 weight)
      for (const phrase of indicators.normal) {
        if (textLower.includes(phrase.toLowerCase())) {
          score += 1.0;
        }
        totalWeight += 1.0;
      }
      
      // Check weak indicators (0.5 weight)
      for (const phrase of indicators.weak) {
        if (textLower.includes(phrase.toLowerCase())) {
          score += 0.5;
        }
        totalWeight += 0.5;
      }
      
      // Add format-based scoring
      if (category === 'Legal') {
        if (/\b(section|article)\s+\d+/i.test(textLower)) score += 2;
        if (/\b(whereas|hereinafter|thereof)\b/i.test(textLower)) score += 2;
      } 
      else if (category === 'Finance') {
        if (/[$€£]\s*\d+([.,]\d+)?/i.test(textLower)) score += 2;
        if (/%\s*\d+([.,]\d+)?/i.test(textLower)) score += 1;
      }
      else if (category === 'Tech') {
        if (/\b(function|class|method|api|endpoint)\b/i.test(textLower)) score += 2;
        if (/\b(fig\.|figure|table)\s+\d+/i.test(textLower)) score += 1;
      }
      else if (category === 'HR') {
        if (/\b(date:?|dob:?|hire date:?)/i.test(textLower)) score += 1;
        if (/\b(id:?|employee\s+number:?)/i.test(textLower)) score += 1;
      }
      
      scores.set(category, Math.min(1, score / (totalWeight || 1)));
    }

    try {
      // Try using BART for classification
      const classifications = await this.bartService.classify(
        text.substring(0, 1000), // Use first 1000 chars for classification
        [...this.labels]
      );
      
      if (classifications && classifications.length > 0) {
        // Add debug logging for classification scores
        console.debug('Classification scores:', 
          classifications.map(c => `${c.label}: ${c.score}`).join(', ')
        );
        
        // Apply category-specific boosts based on strong indicators
        const textLower = text.toLowerCase();
        
        // Check for strong indicators in each category
        for (const [category, indicators] of Object.entries(this.categoryIndicators)) {
          const hasStrongIndicators = indicators.strong.some(phrase => 
            textLower.includes(phrase.toLowerCase())
          );
          
          if (hasStrongIndicators) {
            const categoryClass = classifications.find(c => c.label === category);
            if (categoryClass) {
              categoryClass.score = Math.min(1, categoryClass.score * 1.5);
            }
          }
        }
        
        return classifications.sort((a, b) => b.score - a.score);
      }
    } catch (error) {
      console.warn('BART classification failed, using keyword fallback:', error);
    }
    
    // Use keyword-based results if BART fails
    const results = Array.from(scores.entries())
      .map(([label, score]) => ({ label, score }))
      .sort((a, b) => b.score - a.score);
    
    return results.length > 0 ? results : [{ label: 'Other', score: 1 }];
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

    // Take top 3 sentences
    const summary = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .sort((a, b) => rawSentences.indexOf(a.s) - rawSentences.indexOf(b.s))
      .map(x => x.s)
      .join(' ');

    return summary;
  }
}