import { pdfjsLib } from '../lib/pdfjs-worker';
import { AIService } from './AIService';

export interface ProcessedDocument {
  id: string;
  name: string;
  text: string;
  snippet?: string;
  path: string;
  category?: string;
  confidenceScore?: number;
  classifications?: Array<{
    label: string;
    score: number;
  }>;
  pageCount: number;
  metadata: any;
  title?: string;
  author?: string;
  date?: string;
}

export class PDFProcessor {
  private static instance: PDFProcessor;
  private aiService: AIService;

  private constructor() {
    this.aiService = AIService.getInstance();
  }

  public static getInstance(): PDFProcessor {
    if (!this.instance) {
      this.instance = new PDFProcessor();
    }
    return this.instance;
  }

  async extractTextFromPDF(path: string): Promise<string> {
    try {
      const data = await fetch(path).then(res => res.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }

      return fullText.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw error;
    }
  }

  private findTitleInText(text: string): string | undefined {
    const firstLine = text.split('\n')[0]?.trim();
    if (firstLine && firstLine.length > 5 && firstLine.length < 150) {
      return firstLine;
    }
    return undefined;
  }

  private findAuthorInText(text: string): string | undefined {
    const authorRegex = /(?:Author|By):?\s*([^\n\r]+)/i;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    
    const authorMatch = text.match(authorRegex);
    if (authorMatch) {
      return authorMatch[1].trim();
    }

    const emailMatch = text.match(emailRegex);
    if (emailMatch) {
      return emailMatch[1].trim();
    }

    return undefined;
  }

  async processPDF(path: string, name: string): Promise<ProcessedDocument> {
    try {
      // Load the PDF
      const data = await fetch(path).then(res => res.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data }).promise;
  const metadata: any = await pdf.getMetadata().catch(() => ({}));
  const info = metadata?.info || {};

      // Extract text
      const text = await this.extractTextFromPDF(path);

      // Extract metadata
      const title = info.Title || this.findTitleInText(text);
      const author = info.Author || this.findAuthorInText(text);
      const date = info.CreationDate || info.ModDate;

  // Classify the document
      const classifications = await this.aiService.classifyDocument(text);
      const topCategory = classifications[0];

  // Create a short snippet (first 3 sentences) for indexing
  const sentences = (text || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const snippet = sentences.slice(0, 3).join(' ');

      return {
        id: Math.random().toString(36).substr(2, 9), // Generate a random ID
        name,
        text,
        snippet,
        path,
        category: topCategory.label,
        confidenceScore: topCategory.score,
        classifications,
        pageCount: pdf.numPages,
        metadata: metadata,
        title,
        author,
        date,
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw error;
    }
  }

  async processAllPDFs(pdfFiles: Array<{ path: string; name: string }>): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = [];
    
    for (const file of pdfFiles) {
      try {
        const processed = await this.processPDF(file.path, file.name);
        results.push(processed);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
      }
    }

    return results;
  }
}