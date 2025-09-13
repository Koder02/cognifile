import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
// Import the internal pdf-parse implementation directly to avoid the package's
// debug/test runner in the package root which attempts to read a non-existent
// test file when loaded in some ESM/loader configurations.
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Serve the data folder statically
app.use('/data', express.static(path.join(__dirname, '..', 'data')));

// Get list of PDF files
// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.get('/api/documents', async (req, res) => {
  try {
    console.log('Fetching documents from data directory...');
    const dataDir = path.join(__dirname, '..', 'data');
    console.log('Data directory:', dataDir);
    
    const files = await fs.readdir(dataDir);
    console.log('Files found:', files);
    
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    console.log('PDF files:', pdfFiles);
    
    const documents = pdfFiles.map((file, index) => ({
      id: (index + 1).toString(),
      name: file,
      path: `/data/${file}`,
      type: 'pdf'
    }));
    
    console.log('Sending documents:', documents);
    res.json(documents);
  } catch (error: unknown) {
    console.error('Error reading documents:', error);
    res.status(500).json({ 
      error: 'Failed to read documents', 
      details: error.message || 'Unknown error'
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// QA endpoint: ask a question against a specific document or against all docs (uses semantic service lookup)
app.post('/api/qa', async (req, res) => {
  try {
    const { docId, question } = req.body as { docId?: string; question?: string };
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Missing question in request body' });
    }

    // Helper: read and extract text from a PDF file path (relative to data dir)
    const extractTextFromFile = async (relativePath: string) => {
      const filePath = path.join(__dirname, '..', relativePath.replace(/^\//, ''));
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text || '';
    };

    let targetPath: string | undefined;

    if (docId) {
      // Map docId to file path using same logic as /api/documents
      const dataDir = path.join(__dirname, '..', 'data');
      const files = await fs.readdir(dataDir);
      const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));
      const idx = parseInt(docId, 10) - 1;
      if (isNaN(idx) || idx < 0 || idx >= pdfFiles.length) {
        return res.status(404).json({ error: 'Document id not found' });
      }
      targetPath = `/data/${pdfFiles[idx]}`;
    } else {
      // Use semantic microservice to find top document for the question
      try {
        const semanticRes = await fetch('http://localhost:8001/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: question, top_k: 3 })
        });
        if (semanticRes.ok) {
          const payload = await semanticRes.json();
          const first = payload.results && payload.results[0];
          if (first && first.path) targetPath = first.path;
        } else {
          console.warn('Semantic service search returned non-ok', semanticRes.status);
        }
      } catch (e: unknown) {
        console.warn('Semantic service unavailable:', (e && e.message) || e);
      }
    }

    if (!targetPath) {
      return res.status(404).json({ error: 'No target document found for QA' });
    }

    const text = await extractTextFromFile(targetPath);

    // Split into candidate sentences (keep sentences reasonably long)
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s: string) => (s || '').replace(/\s+/g, ' ').trim())
      .filter((s: string) => s.length > 20);

    const qTokens = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

    // Score sentences by token overlap weighted by frequency
    const scores = sentences.map((s: string) => {
      const tokens = (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
      const tokenSet = new Set(tokens);
      let matchCount = 0;
      for (const qt of qTokens) if (tokenSet.has(qt)) matchCount += 1;
      return { sentence: s, score: matchCount };
    });

  scores.sort((a: {score:number}, b: {score:number}) => b.score - a.score);
  const top = (scores.slice(0, 5) as Array<{sentence:string;score:number}>).filter((s) => s.score > 0);

  const answer = top.map((t) => t.sentence).join(' ');

    return res.json({
      question,
      answer: answer || 'No direct answer found in the document.',
      snippets: top,
      source: targetPath
    });
  } catch (error: unknown) {
    console.error('QA error:', error);
    return res.status(500).json({ error: 'QA failed', details: error.message || String(error) });
  }
});