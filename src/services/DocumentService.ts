import { PDFDocumentProxy } from 'pdfjs-dist';
import { AIService } from './AIService';
import { pdfjsLib } from '../lib/pdfjs-worker';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creationDate?: string;
  modificationDate?: string;
  pageCount?: number;
  fileSize?: string;
  summary?: string;
  fileType?: string;
  entities?: { type: string; value: string }[];
}

export interface DocumentInfo {
  id: string;
  name: string;
  path: string;
  type: string;
  classification?: string;
  thumbnail?: string;
  processingStatus?: 'idle' | 'processing' | 'completed' | 'error';
  metadata?: DocumentMetadata;
}

export class DocumentService {
  private static instance: DocumentService | null = null;
  private documents: DocumentInfo[] = [];
  private aiService: AIService | null = null;

  private constructor() {
    // Initialize AIService lazily to avoid circular dependencies
    this.initializeAIService();
  }

  private async initializeAIService() {
    try {
      this.aiService = AIService.getInstance();
    } catch (error) {
      console.error('Error initializing AIService:', error);
    }
  }

  public static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  private async classifyDocument(document: DocumentInfo): Promise<void> {
    try {
      document.processingStatus = 'processing';
      
      if (!this.aiService) {
        console.warn('AI Service not initialized; skipping classification');
        document.classification = 'Unknown';
        document.processingStatus = 'completed';
        return;
      }
      // If the encoder model failed to load (network issues), skip heavy classification
      const encoderReady = await this.aiService.isReady();
      if (!encoderReady) {
        console.warn('AI encoder not ready; skipping classification for document', document.id);
        document.classification = 'Unknown';
        document.processingStatus = 'completed';
        return;
      }

      // Extract text from the PDF
      const text = await this.aiService.extractTextFromPDF(document.path);

      // Get document classification using USE model
      const classifications = await this.aiService.classifyDocument(text);
      const topClassification = classifications[0];

      document.classification = topClassification.label;
      document.processingStatus = 'completed';
    } catch (error) {
      console.error('Error classifying document:', error);
      document.processingStatus = 'error';
      document.classification = 'Unknown';
    }
  }

  async loadDocuments(): Promise<DocumentInfo[]> {
    try {
      console.log('Attempting to fetch documents from server...');
      const response = await fetch('http://localhost:3001/api/documents', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response not OK:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Received document data:', data);

      // Transform the document data and prepend the server URL for paths
      this.documents = data.map((doc: any) => ({
        ...doc,
        path: `http://localhost:3001${doc.path}`, // Prepend server URL to path
        processingStatus: 'idle',
        type: doc.type.toUpperCase() // Normalize type to uppercase
      }));

      // Start document classification in parallel
      console.log('Starting document classification...');
      const classificationPromises = this.documents.map(doc => this.classifyDocument(doc));
      await Promise.all(classificationPromises);

      return this.documents;
    } catch (error) {
      console.error('Error loading documents:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  async loadPDF(path: string): Promise<PDFDocumentProxy> {
    try {
      // Fetch the PDF file if it's a URL
      if (path.startsWith('http')) {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        return pdf;
      } else {
        // Load local file directly
        const pdf = await pdfjsLib.getDocument(path).promise;
        return pdf;
      }
    } catch (error) {
      console.error('Error loading PDF:', error);
      throw error;
    }
  }

  async generateThumbnail(pdfPath: string): Promise<string> {
    try {
      const pdf = await this.loadPDF(pdfPath);
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.5 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
        canvas: canvas
      }).promise;
      
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw error;
    }
  }

  private async extractTextFromPage(page: any): Promise<string> {
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => item.str).join(' ');
  }

  async getDocumentMetadata(document: DocumentInfo): Promise<DocumentMetadata> {
    try {
      // Attempt to load PDF and extract basic metadata. Make each step resilient so
      // we can still return partial metadata if some operations fail.
      let pdf: any = null;
      let metadata: any = null;
      let firstPageText = '';
      let pageCount = 0;

      try {
        pdf = await this.loadPDF(document.path);
        metadata = await pdf.getMetadata();
        const firstPage = await pdf.getPage(1);
        firstPageText = await this.extractTextFromPage(firstPage);
        pageCount = pdf.numPages;
      } catch (pdfErr) {
        console.warn('Failed to load PDF or extract page text:', pdfErr);
      }

      // Get file size (best effort)
      let fileSize = 'Unknown';
      try {
        const response = await fetch(document.path);
        if (response.ok) {
          const blob = await response.blob();
          fileSize = (blob.size / (1024 * 1024)).toFixed(2) + ' MB';
        } else {
          console.warn('Failed to fetch file for size:', response.status, response.statusText);
        }
      } catch (e) {
        console.warn('Error fetching file size:', e);
      }

      // Generate summary using AI (fall back to local extractive method if AI unavailable)
      let summary = 'Summary not available';
      try {
        if (this.aiService) {
          summary = await this.aiService.generateSummary(firstPageText || '');
        } else {
          summary = 'Summary not available';
        }
      } catch (sumErr) {
        console.warn('Error generating summary:', sumErr);
        summary = 'Summary not available';
      }

      // Type assertion for metadata.info
      const info = (metadata && metadata.info) ? (metadata.info as Record<string, string>) : {};

      // Heuristic title: prefer PDF Title metadata; otherwise first long line / sentence from firstPageText
      let title = info?.Title || document.name;
      if ((!info || !info.Title) && firstPageText) {
        const lines = firstPageText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const candidate = lines.find(l => l.length > 30) || lines[0] || '';
        // If candidate is a long sentence, take up to the first line
        title = candidate.split(/[.!?]\s/)[0].slice(0, 120) || title;
      }

      // Heuristic author: look for explicit markers or emails
      let author = info?.Author || info?.Creator || 'Unknown';
      if (firstPageText) {
        const authorMatch = firstPageText.match(/(?:Author|By)[:\s]+([A-Za-z ,.\-]+)/i);
        if (authorMatch && authorMatch[1]) author = authorMatch[1].trim();
        else {
          const emailMatch = firstPageText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
          if (emailMatch) author = emailMatch[0];
        }
      }

      // Heuristic date detection (common formats)
      let creationDateStr = info?.CreationDate || info?.ModDate || '';
      if (!creationDateStr && firstPageText) {
        const dateMatch = firstPageText.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i);
        if (dateMatch) creationDateStr = dateMatch[0];
      }

      // Entities: emails, amounts, possible person/org names via capitalization heuristics
      const entities: { type: string; value: string }[] = [];
      if (firstPageText) {
        const emailRe = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
        const moneyRe = /\$?\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/g;
        const emails = (firstPageText.match(emailRe) || []).slice(0, 5);
        const monies = (firstPageText.match(moneyRe) || []).slice(0, 5);
        for (const e of emails) entities.push({ type: 'email', value: e });
        for (const m of monies) entities.push({ type: 'amount', value: m });

        // Simple name/org heuristics: look for Title Case sequences of 2-4 words
        const nameRe = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3})\b/g;
        const names = Array.from(new Set((firstPageText.match(nameRe) || []).slice(0, 10)));
        for (const n of names) {
          // Avoid adding words that are common section headers
          if (/^(Page|Chapter|Table|Figure|Section)$/i.test(n)) continue;
          entities.push({ type: 'name', value: n });
        }
      }

      const metaInfo: DocumentMetadata = {
        title: title || document.name,
        author: author || 'Unknown',
        subject: info?.Subject,
        keywords: info?.Keywords ? info.Keywords.split(',').map((k: string) => k.trim()) : [],
        creationDate: creationDateStr || undefined,
        modificationDate: info?.ModDate,
        pageCount: pageCount || 0,
        fileSize,
        summary,
        fileType: document.type || (document.name.split('.').pop() || 'PDF'),
        entities
      };

      // Update the document with metadata
      document.metadata = metaInfo;

      return metaInfo;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return {
        title: document.name,
        author: 'Unknown',
        pageCount: 0,
        fileSize: 'Unknown',
        summary: 'Failed to generate summary'
      };
    }
  }
}

// Create and export the default instance
const defaultInstance = DocumentService.getInstance();
export default defaultInstance;