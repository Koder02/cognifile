import { HfInference } from '@huggingface/inference';

export class BartService {
  private static instance: BartService;
  private hf: HfInference;
  private modelId = 'facebook/bart-large-mnli';  // Using the model from Hugging Face Hub directly

  private constructor() {
    // Initialize with your Hugging Face API token if you have one
    const apiToken = import.meta.env.VITE_HUGGINGFACE_API_TOKEN;
    this.hf = new HfInference(apiToken);
  }

  public static getInstance(): BartService {
    if (!BartService.instance) {
      BartService.instance = new BartService();
    }
    return BartService.instance;
  }

  async classify(text: string, labels: string[]): Promise<Array<{ label: string; score: number }>> {
    try {
      // Using zero-shot classification
      const response = await this.hf.zeroShotClassification({
        model: this.modelId,
        inputs: text,
        parameters: { candidate_labels: labels }
      });

      // Transform the response to match our expected format
      return labels.map((label: string, index: number): { label: string; score: number } => ({
        label,
        score: response[0]?.labels?.includes(label) ? (response[0]?.scores?.[index] || 0) : 0
      }));
    } catch (error) {
      console.error('Error in BART classification:', error);
      throw error;
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const response = await this.hf.summarization({
        model: 'facebook/bart-large-cnn',  // Using BART CNN model which is better for summarization
        inputs: text,
        parameters: {
          max_length: 130,
          min_length: 30,
        }
      });

      return response.summary_text;
    } catch (error) {
      console.error('Error in BART summarization:', error);
      throw error;
    }
  }
}