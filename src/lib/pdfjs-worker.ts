import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

// Set the worker source path
GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

// Re-export the configured PDF.js
export const pdfjsLib = { getDocument, GlobalWorkerOptions };