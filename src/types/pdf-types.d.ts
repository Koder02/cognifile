interface PDFProgress {
  loaded: number;
  total: number;
}

declare module 'pdfjs-dist' {
  interface PDFDocumentLoadingTask {
    onProgress?: (progress: PDFProgress) => void;
  }
}