import * as pdfjsLib from 'pdfjs-dist';

// Dynamically import the worker
async function setupWorker() {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Use the local worker file from our public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  }
}

// Initialize the worker
setupWorker().catch(console.error);

export { pdfjsLib };