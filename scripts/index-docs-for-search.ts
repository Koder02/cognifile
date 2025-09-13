import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';

interface DocumentToIndex {
  id: string;
  text: string;
  name?: string;
  path?: string;
}

async function run() {
  const docsDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(docsDir)) {
    console.error('Docs directory not found:', docsDir);
    return;
  }

  const files = fs.readdirSync(docsDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  const docs: DocumentToIndex[] = [];

  for (const f of files) {
    const relativePath = `/data/${f}`;
    const fullPath = path.join(docsDir, f);
    try {
      const buffer = fs.readFileSync(fullPath);
      const parsed = await pdfParse(buffer as any);
      const text = parsed && parsed.text ? parsed.text : '';
      // Keep only the first 3 sentences for semantic indexing
      const lines = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
      const snippet = lines.slice(0, 3).join(' ');
      docs.push({ id: f, text: snippet, name: f, path: `http://localhost:3001${relativePath}` });
    } catch (e) {
      console.warn('Failed to extract text for', f, e);
    }
  }

  if (docs.length === 0) {
    console.log('No docs to index');
    return;
  }

  const res = await fetch('http://localhost:8001/index', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(docs)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Indexing failed:', res.status, text);
    return;
  }

  const data = await res.json();
  console.log('Indexed:', data);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
