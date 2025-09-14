import { useEffect, useState } from 'react';
import { PDFProcessor } from '../../services/PDFProcessor';
import { SearchService } from '../../services/SearchService';

const PDF_FILES = [
  { name: '100001798.pdf', path: './data/100001798.pdf' },
  { name: '3594737.pdf', path: './data/3594737.pdf' },
  { name: 'd.pdf', path: './data/d.pdf' },
  { name: 'data-feed-2024.pdf', path: './data/data-feed-2024.pdf' },
  { name: 'Empirical_data_analysis.pdf', path: './data/Empirical_data_analysis.pdf' },
  { name: 'ff.pdf', path: './data/ff.pdf' },
  { name: 'ffff.pdf', path: './data/ffff.pdf' },
  { name: 'FSVV_Feb2024.pdf', path: './data/FSVV_Feb2024.pdf' },
  { name: 'pdf-8.pdf', path: './data/pdf-8.pdf' },
  { name: 'sdTCG_v4.4_October_FINAL.pdf', path: './data/sdTCG_v4.4_October_FINAL.pdf' }
];

interface DocumentProcessorProps {
  onProcessingComplete: () => void;
}

export default function DocumentProcessor({ onProcessingComplete }: DocumentProcessorProps) {
  // no visible state needed; processing runs in background
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processDocuments = async () => {
      try {
        const pdfProcessor = PDFProcessor.getInstance();
        const searchService = SearchService.getInstance();
  // processing batches

        // Process PDFs in batches of 2 to avoid overwhelming the system
        for (let i = 0; i < PDF_FILES.length; i += 2) {
          const batch = PDF_FILES.slice(i, i + 2);
          const results = await pdfProcessor.processAllPDFs(batch);

          results.forEach(doc => {
            searchService.addDocument({
              id: doc.id,
              name: doc.name,
              text: doc.snippet || doc.text,
              category: doc.category || 'Uncategorized',
              confidence: doc.confidenceScore || 0,
              path: doc.path
            });
          });
        }

        // All batches processed
        onProcessingComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while processing documents');
      }
    };

    processDocuments();
  }, [onProcessingComplete]);

    // We intentionally do not render a blocking modal here so the app can display documents
    // while processing happens in the background. Keep the component invisible.
    if (error) {
      console.error('DocumentProcessor error:', error);
      onProcessingComplete();
    }

    return null;
}
