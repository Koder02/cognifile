// Generates public/data/index.json from files present in public/data
import fs from 'fs';
import path from 'path';

const dataDir = path.resolve(process.cwd(), 'public', 'data');
const outFile = path.join(dataDir, 'index.json');

try {
  if (!fs.existsSync(dataDir)) {
    console.log('public/data directory not found; skipping index generation');
    process.exit(0);
  }
  const files = fs.readdirSync(dataDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  fs.writeFileSync(outFile, JSON.stringify(files, null, 2), 'utf-8');
  console.log('Wrote', outFile, 'with', files.length, 'entries');
} catch (err) {
  console.error('Error generating data index:', err);
  process.exit(1);
}
