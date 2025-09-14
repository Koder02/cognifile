import { pdfjsLib } from '../lib/pdfjs-worker';
import { AIService as ExternalAIService, ClassificationResult } from './AIService';

export interface ProcessedDocument {
  id: string;
  name: string;
  text: string;
  snippet?: string;
  summary?: string;
  path: string;
  category?: string;
  confidenceScore?: number;
  classifications?: ClassificationResult[];
  pageCount: number;
  metadata: any;
  title?: string;
  author?: string;
  date?: string;
}

export class PDFProcessor {
  private static instance: PDFProcessor;
  private aiService: ExternalAIService;
  private cache: Map<string, ProcessedDocument> = new Map();
  private processingQueue: Map<string, Promise<ProcessedDocument>> = new Map();

  private constructor() {
    this.aiService = ExternalAIService.getInstance();
    // Try to load cache from localStorage
    try {
      const savedCache = localStorage.getItem('pdfProcessorCache');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as ProcessedDocument);
        });
        console.log(`Loaded ${this.cache.size} documents from cache`);
      }
    } catch (error) {
      console.warn('Failed to load cache:', error);
    }
  }

  public static getInstance(): PDFProcessor {
    if (!this.instance) {
      this.instance = new PDFProcessor();
    }
    return this.instance;
  }

  private saveCache(): void {
    try {
      const cacheObject = Object.fromEntries(this.cache.entries());
      localStorage.setItem('pdfProcessorCache', JSON.stringify(cacheObject));
    } catch (error) {
      console.warn('Failed to save cache:', error);
    }
  }

  async extractTextFromPDF(path: string): Promise<string> {
    try {
      // Resolve the path to a valid absolute URL or leave blob/data URLs as-is
      const fullPath = this.resolvePath(path);

      const res = await fetch(fullPath);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.arrayBuffer();

      // pdfjs-lib accepts an ArrayBuffer via the 'data' option when calling getDocument
  const loadingTask: any = (pdfjsLib as any).getDocument({ data });
  const pdf: any = await loadingTask.promise;
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

  /**
   * Quickly extract text from the first page to provide an immediate snippet.
   * This is faster than extracting the whole PDF and suitable for previews.
   */
  async quickExtractSnippet(path: string): Promise<string> {
    try {
      const fullPath = this.resolvePath(path);
      const res = await fetch(fullPath);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.arrayBuffer();
  const loadingTask: any = (pdfjsLib as any).getDocument({ data });
  const pdf: any = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      const sentences = (pageText || '').split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean);
      return sentences.slice(0, 3).join(' ');
    } catch (error) {
      console.warn('quickExtractSnippet failed:', error);
      return '';
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

  // Resolve path to absolute URL when necessary. Leave blob: and data: URIs unchanged.
  private resolvePath(path: string): string {
    if (!path) return path;
    const trimmed = path.trim();
    if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return trimmed;
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    // For Vite dev server, use relative paths to access files in public/
    const base = window.location.pathname.endsWith('/') ? '.' : '.';
    return base + (trimmed.startsWith('/') ? trimmed : '/' + trimmed);
  }

  async processPDF(path: string, name: string): Promise<ProcessedDocument> {
    const cacheKey = `${path}:${name}`;
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    // Check if already processing
    if (this.processingQueue.has(cacheKey)) {
      return await this.processingQueue.get(cacheKey)!;
    }
    // Start processing
    const processingPromise = (async () => {
      try {
        // Resolve the path once and use the resolved URL for all fetches
  const resolvedPath = this.resolvePath(path);
        // Load PDF and extract text in parallel
        const [pdfDataResponse, extractedText] = await Promise.all([
          fetch(resolvedPath).then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.arrayBuffer();
          }),
          this.extractTextFromPDF(resolvedPath)
        ]);
  const loadingTask: any = (pdfjsLib as any).getDocument({ data: pdfDataResponse });
  const pdf: any = await loadingTask.promise;
  const metadata = await pdf.getMetadata().catch(() => ({}));
        const info = (metadata as any)?.info || {};
        // Create sentences array and build snippet + short summary (5-6 sentences)
        const sentences = (extractedText || '').split(/(?<=[.!?])\s+/)
          .map((s: string) => s.trim())
          .filter(Boolean);
        const snippet = sentences.slice(0, 3).join(' ');
        const summary = sentences.slice(0, 6).join(' ');
        // Classify document
        let classifications: ClassificationResult[] = [];
        let topCategory: ClassificationResult = { label: 'Unclassified', score: 0 };
        try {
          const result = await this.aiService.classifyDocument(extractedText);
          if (Array.isArray(result) && result.length > 0) {
            classifications = result;
            topCategory = result[0];
          }
        } catch (error) {
          console.error('Error classifying document:', error);
        }
        // Debug: log the top classification for observability during testing
        try {
          console.debug(`PDFProcessor: topCategory for ${name} ->`, topCategory);
        } catch (e) {}
        const processed: ProcessedDocument = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          text: extractedText,
          snippet,
          summary,
          path,
          category: topCategory.label,
          confidenceScore: topCategory.score,
          classifications,
          pageCount: pdf.numPages,
          metadata: info,
          title: info.Title || this.findTitleInText(extractedText) || name,
          author: info.Author || this.findAuthorInText(extractedText) || 'Unknown',
          date: info.CreationDate || info.ModDate,
        };
        this.cache.set(cacheKey, processed);
        this.saveCache();
        return processed;
      } catch (error) {
        console.error('Error processing PDF:', error);
        throw error;
      }
    })();
    this.processingQueue.set(cacheKey, processingPromise);
    try {
      const result = await processingPromise;
      return result;
    } finally {
      this.processingQueue.delete(cacheKey);
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

