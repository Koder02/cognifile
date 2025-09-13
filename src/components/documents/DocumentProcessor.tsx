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
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processDocuments = async () => {
      try {
        const pdfProcessor = PDFProcessor.getInstance();
        const searchService = SearchService.getInstance();
        let processed = 0;

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

          processed += batch.length;
          setProgress((processed / PDF_FILES.length) * 100);
        }

        setIsProcessing(false);
        onProcessingComplete();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while processing documents');
        setIsProcessing(false);
      }
    };

    processDocuments();
  }, [onProcessingComplete]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-red-600 font-semibold mb-2">Error</h3>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-xl font-semibold mb-4">Processing Documents</h3>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-gray-600 mt-2 text-sm text-center">
            {Math.round(progress)}% Complete
          </p>
        </div>
      </div>
    );
  }

  return null;
}
