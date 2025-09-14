import { HfInference } from '@huggingface/inference';

export class BartService {
  private static instance: BartService;
  private hf: HfInference;
  private modelId = 'facebook/bart-large-mnli';  // Use a known HF inference model that supports zero-shot

  private constructor() {
    // Initialize with your Hugging Face API token if you have one
    const apiToken = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
    if (!apiToken) {
      throw new Error('Hugging Face API token not found in environment variables');
    }
    this.hf = new HfInference(apiToken);
    // Validate the token on initialization
    this.validateToken();
  }

  private async validateToken() {
    try {
      // Try a simple text classification as validation
      await this.hf.zeroShotClassification({
        model: this.modelId,
        inputs: "Test document",
        parameters: { candidate_labels: ["test"] }
      });
    } catch (error) {
      console.error('Failed to validate Hugging Face token:', error);
      // Don't throw, just log the error
      console.warn('Token validation failed, some features may be limited');
    }
  }

  public static getInstance(): BartService {
    if (!BartService.instance) {
      BartService.instance = new BartService();
    }
    return BartService.instance;
  }

  private categoryIndicators: Record<string, { strong: string[], normal: string[], weak: string[] }> = {
    Finance: {
      strong: ['balance sheet', 'income statement', 'cash flow', 'fiscal year', 'quarterly report', 'annual report', 'profit margin'],
      normal: ['invoice', 'payment', 'financial', 'budget', 'tax', 'revenue', 'expense', 'audit', 'account'],
      weak: ['total', 'amount', 'price', 'cost', 'fund']
    },
    HR: {
      strong: ['employment contract', 'performance review', 'compensation package', 'personnel file', 'disciplinary action'],
      normal: ['employee', 'recruitment', 'benefits', 'payroll', 'hr policy', 'staff', 'hiring'],
      weak: ['training', 'development', 'team', 'office']
    },
    Legal: {
      strong: ['court order', 'legal proceeding', 'pursuant to', 'jurisdiction', 'statutory', 'plaintiff', 'defendant'],
      normal: ['contract', 'agreement', 'law', 'regulation', 'compliance', 'legal', 'attorney'],
      weak: ['rights', 'policy', 'terms']
    },
    'Tech': {
      strong: ['source code', 'api documentation', 'technical specification', 'system architecture', 'database schema'],
      normal: ['algorithm', 'software', 'database', 'implementation', 'protocol', 'framework'],
      weak: ['data', 'system', 'process', 'test']
    },
    Other: {
      strong: [],
      normal: ['general', 'miscellaneous'],
      weak: ['other', 'unknown']
    }
  };

  private keywordMap: Record<string, string[]> = {};

  private getKeywordBasedScore(text: string, label: string): number {
    const indicators = this.categoryIndicators[label];
    if (!indicators) return 0;
    
    const textLower = text.toLowerCase();
    let score = 0;
    let totalWeight = 0;
    
    // Check for strong indicators (weight: 3.0)
    for (const phrase of indicators.strong) {
      if (textLower.includes(phrase.toLowerCase())) {
        score += 3.0;
      }
      totalWeight += 3.0;
    }
    
    // Check for normal indicators (weight: 1.0)
    for (const phrase of indicators.normal) {
      if (textLower.includes(phrase.toLowerCase())) {
        score += 1.0;
      }
      totalWeight += 1.0;
    }
    
    // Check for weak indicators (weight: 0.5)
    for (const phrase of indicators.weak) {
      if (textLower.includes(phrase.toLowerCase())) {
        score += 0.5;
      }
      totalWeight += 0.5;
    }
    
    // Consider paragraph structure and formatting for each category
    if (label === 'Legal') {
      // Look for numbered paragraphs, section headers
      if (/\b(section|article)\s+\d+/i.test(textLower)) score += 2;
      if (/\b(whereas|hereinafter|thereof)\b/i.test(textLower)) score += 2;
    } 
    else if (label === 'Finance') {
      // Look for currency symbols, percentages, tables
      if (/[$€£]\s*\d+([.,]\d+)?/i.test(textLower)) score += 2;
      if (/%\s*\d+([.,]\d+)?/i.test(textLower)) score += 1;
    }
    else if (label === 'Tech') {
      // Look for code snippets, technical formatting
      if (/\b(function|class|method|api|endpoint)\b/i.test(textLower)) score += 2;
      if (/\b(fig\.|figure|table)\s+\d+/i.test(textLower)) score += 1;
    }
    else if (label === 'HR') {
      // Look for date patterns and personal info formatting
      if (/\b(date:?|dob:?|hire date:?)/i.test(textLower)) score += 1;
      if (/\b(id:?|employee\s+number:?)/i.test(textLower)) score += 1;
    }
    
    // Normalize score to 0-1 range
    return Math.min(1, score / (totalWeight || 1));
  }

  async classify(text: string, labels: string[]): Promise<Array<{ label: string; score: number }>> {
    try {
      // First get keyword-based scores as fallback
      const keywordScores = labels.map(label => ({
        label,
        score: this.getKeywordBasedScore(text, label)
      }));

      if (!text || text.trim().length === 0) {
        return keywordScores;
      }

      // Truncate and clean text
      const truncatedText = text
        .slice(0, 500)
        .replace(/\s+/g, ' ')
        .trim();

      try {
        // Attempt HuggingFace classification
        const response = await this.hf.zeroShotClassification({
          model: this.modelId,
          inputs: truncatedText,
          parameters: { 
            candidate_labels: labels
          }
        });

        // Hugging Face client can return different shapes depending on runtime.
        // Normalize possible shapes: array of results or single object.
        const resultObj = Array.isArray(response) ? response[0] : response;
        if (resultObj && resultObj.labels && resultObj.scores) {
          // Combine API and keyword scores. The API may return labels in a different
          // order than the `labels` input, so look up the API score by label index.
          return labels.map((label: string, index: number) => {
            const apiIndex = resultObj.labels.indexOf(label);
            const apiScore = apiIndex >= 0 ? (resultObj.scores[apiIndex] || 0) : 0;
            return {
              label,
              score: Math.max(apiScore, keywordScores[index].score)
            };
          }).sort((a, b) => b.score - a.score);
        }
      } catch (apiError) {
        console.warn('API classification failed, using keyword fallback:', apiError);
      }

      // Return keyword-based scores if API fails
      return keywordScores.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Error in classification:', error);
      // Return a safe default if everything fails
      return [{ label: 'Other', score: 1 }];
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      if (!text || text.trim().length === 0) {
        return 'No content available for summarization';
      }

      // Clean and truncate text
      const truncatedText = text
        .slice(0, 1000)
        .replace(/\s+/g, ' ')
        .trim();
      
      const response = await this.hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: truncatedText,
        parameters: {
          max_length: 130,
          min_length: 30,
          temperature: 0.7,
          top_p: 0.95
        }
      });

      if (!response?.summary_text) {
        // Fallback to extractive summarization
        const sentences = truncatedText.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, 3).join(' ').trim() || 'Summary not available';
      }

      return response.summary_text;
    } catch (error) {
      console.error('Error in summarization:', error);
      // Fallback to extractive summarization
      try {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, 3).join(' ').trim() || 'Summary not available';
      } catch (fallbackError) {
        return text.slice(0, 200) + '...';
      }
    }
  }
}