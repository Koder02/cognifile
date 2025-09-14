declare module 'pdfjs-dist' {
  interface PDFDocumentLoadingTask {
    onProgress?: (progress: { loaded: number; total: number }) => void;
    promise: Promise<PDFDocumentProxy>;
  }

  interface PDFPageProxy {
    getViewport: (options: { scale: number; rotation?: number }) => {
      width: number;
      height: number;
    };
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
      enableWebGL?: boolean;
    }) => { promise: Promise<void> };
  }

  interface PDFDocumentProxy {
    numPages: number;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
  }

  export interface GlobalWorkerOptions {
    workerSrc: string;
  }

  export const GlobalWorkerOptions: GlobalWorkerOptions;

  export function getDocument(options: {
    url: string;
    cMapUrl?: string;
    cMapPacked?: boolean;
  }): PDFDocumentLoadingTask;
}