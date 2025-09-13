import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Source path in node_modules
const workerSrc = join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');

// Destination path in public directory
const workerDest = join(__dirname, '..', 'public', 'pdfjs', 'pdf.worker.min.mjs');

async function copyWorkerFile() {
    try {
        // Ensure the destination directory exists
        await fs.mkdir(dirname(workerDest), { recursive: true });
        
        // Copy the worker file
        await fs.copyFile(workerSrc, workerDest);
        console.log('PDF.js worker file copied successfully!');
    } catch (error) {
        console.error('Error copying PDF.js worker file:', error);
        process.exit(1);
    }
}

copyWorkerFile();