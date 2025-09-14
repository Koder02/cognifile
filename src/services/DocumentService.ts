import { PDFDocumentProxy } from 'pdfjs-dist';
import { AIService } from './AIService';
import { pdfjsLib } from '../lib/pdfjs-worker';
import { PDFProcessor } from './PDFProcessor';

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
  title: string;
  path: string;
  type: string;
  size: string;
  thumbnail?: string;
  author: string;
  uploadDate: string;
  summary?: string;
  content?: string;
  tags: string[];
  classification?: string;
  category?: string;
  processingStatus?: 'idle' | 'processing' | 'completed' | 'error';
  entities: { type: string; value: string }[];
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

  private async processDocument(document: DocumentInfo): Promise<void> {
    try {
      document.processingStatus = 'processing';
      
      // Create PDFProcessor instance
      const pdfProcessor = PDFProcessor.getInstance();
      
      // Process the PDF
      const processedDoc = await pdfProcessor.processPDF(document.path, document.name);
      
      // Update document with processed information
      document.metadata = {
        title: processedDoc.title,
        author: processedDoc.author,
        creationDate: processedDoc.date,
        pageCount: processedDoc.pageCount,
        summary: processedDoc.summary || processedDoc.snippet || processedDoc.text.substring(0, 500) + '...'
      };

      // Classify the document using BART, but preserve any existing user-assigned category
      if (this.aiService) {
        const classifications = await this.aiService.classifyDocument(processedDoc.text) as Array<{ label: string; score?: number }> | undefined;
        if (classifications?.length) {
          const top = classifications[0];
          // Set classification always (for search/filtering), but only overwrite category
          // if it was previously unset/uncategorized or if the model is confident.
          document.classification = top.label;
          const existingCategory = (document.category || '').trim();
          const isUncategorized = !existingCategory || existingCategory === 'Uncategorized';
          // Do not overwrite a non-empty category — treat user-assigned categories as authoritative.
          if (isUncategorized) {
            document.category = top.label;
          } else {
            // preserve existing category
            document.category = existingCategory;
          }
        }
      }

  // Also add summary and full content directly for search
  document.summary = processedDoc.summary || processedDoc.snippet || processedDoc.text.substring(0, 500) + '...';
  (document as any).content = processedDoc.text;
      document.category = document.classification || document.category;
      document.processingStatus = 'completed';

      // Emit a global event so UI (notifications) can react to processed documents
      try {
        window.dispatchEvent(new CustomEvent('documentProcessed', { detail: { id: document.id, name: document.name, category: document.category, summary: document.summary, content: (document as any).content } }));
      } catch (e) {
        // ignore when running in non-browser test environments
      }
    } catch (error) {
      console.error('Error processing document:', error);
      document.processingStatus = 'error';
      document.classification = 'Unknown';
    }
  }

  async loadDocuments(): Promise<DocumentInfo[]> {
    try {
      console.log('Loading documents from public/data directory...');
      // Try to auto-discover PDFs in the public `/data/` folder.
      // Strategy: 1) attempt to fetch `/data/index.json` (authoritative manifest)
      // 2) fall back to fetching `/data/` and parsing an HTML directory listing (if the dev server provides one)
      // 3) final fallback to the known static list maintained here.
      let fileList: string[] = [];
      try {
        console.log('Attempting to fetch /data/index.json...');
        // Try with and without leading slash to handle different Vite base paths
        const manifestRes = await fetch('./data/index.json').catch(() => fetch('/data/index.json'));
        console.log('Manifest response:', manifestRes.status, manifestRes.statusText);
        if (manifestRes.ok) {
          const manifest = await manifestRes.json();
          console.log('Parsed manifest:', manifest);
          if (Array.isArray(manifest)) {
            fileList = manifest.filter((f: any) => typeof f === 'string' && f.toLowerCase().endsWith('.pdf'));
            console.info('Loaded PDF manifest from /data/index.json:', fileList);
          }
        } else {
          console.warn('Failed to load manifest:', manifestRes.status, manifestRes.statusText);
        }
      } catch (e) {
        console.error('Error loading manifest:', e);
        // ignore manifest errors and try directory listing
      }

      if (!fileList || fileList.length === 0) {
        try {
          const dirRes = await fetch('/data/');
          if (dirRes.ok) {
            const contentType = dirRes.headers.get('content-type') || '';
            if (contentType.includes('text/html')) {
              const html = await dirRes.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const links = Array.from(doc.querySelectorAll('a')) as HTMLAnchorElement[];
              const pdfs = links
                .map(a => a.getAttribute('href') || '')
                .filter(h => h.toLowerCase().endsWith('.pdf'))
                .map(h => h.replace(/^\/?data\//, ''));
              if (pdfs.length > 0) {
                fileList = pdfs;
                console.info('Discovered PDFs by parsing /data/ HTML listing:', fileList);
              }
            }
          }
        } catch (e) {
          // ignore and fallback
        }
      }

      // Final fallback if discovery failed
      if (!fileList || fileList.length === 0) {
        fileList = [
          '100001798.pdf',
          '3594737.pdf',
          'd.pdf',
          'data-feed-2024.pdf',
          'Empirical_data_analysis.pdf',
          'ff.pdf',
          'ffff.pdf',
          'FSVV_Feb2024.pdf',
          'pdf-8.pdf',
          'sdTCG_v4.4_October_FINAL.pdf'
        ];
        console.warn('Falling back to static file list for documents:', fileList);
      }

      // Create document objects
      this.documents = fileList.map((filename) => ({
        id: filename.replace('.pdf', ''),
        name: filename,
        title: filename.replace(/\.[^/.]+$/, ''),
        path: `/data/${filename}`,
        type: 'application/pdf',
        size: '0 MB', // Will be updated when file is processed
        author: 'Unknown', // Will be updated when file is processed
        uploadDate: new Date().toISOString(),
        summary: 'Processing...',
        content: '',
        tags: ['imported'],
        entities: [] as { type: string; value: string }[],
        processingStatus: 'processing',
        category: 'Uncategorized'
      }));

      // Provide immediate quick snippets and start background processing for full summaries
      const pdfProcessor = PDFProcessor.getInstance();
      for (const doc of this.documents) {
        try {
          // quickExtractSnippet provides a fast preview from first page
          const quick = await pdfProcessor.quickExtractSnippet(doc.path);
          doc.summary = quick || 'Processing...';
          (doc as any).content = quick || '';
          // Kick off full processing in background (do not await)
          this.processDocument(doc).catch(err => console.error(`Background processing failed for ${doc.name}:`, err));
        } catch (e) {
          console.error(`Error initiating processing for ${doc.name}:`, e);
          doc.summary = 'Processing...';
        }
      }

      console.log('Documents loaded and initially processed:', this.documents.length);
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
        if (this.aiService && firstPageText) {
          // Use only the first 1000 characters for the summary to avoid overwhelming the model
          const textToSummarize = firstPageText.slice(0, 1000);
          
          // Get instance from AIService and generate summary
          const aiInstance = AIService.getInstance();
          if (aiInstance instanceof AIService) {
            const result = await aiInstance.generateSummary(textToSummarize);
            if (result) {
              summary = result;
            }
          }
        }
      } catch (sumErr) {
        console.warn('Error generating summary:', sumErr);
        // Fall back to first few sentences if summary generation fails
        summary = firstPageText.split(/[.!?]\s+/).slice(0, 2).join('. ') + '.';
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