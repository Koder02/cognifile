import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface PDFProgress {
  loaded: number;
  total: number;
}

interface PDFViewerProps {
  /** The URL of the PDF file to display */
  url: string;
  /** Optional className for styling the container */
  className?: string;
}

export default function PDFViewer({ url, className = 'w-full' }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const pdfDocRef = useRef<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const renderTaskRef = useRef<{ promise: Promise<void> } | null>(null);

  // Calculate initial scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Set scale to fit the container width with some padding
        setScale(Math.min((containerWidth - 48) / 595, 2.0)); // 595 is standard PDF width
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    const loadPDF = async () => {
      if (!url) return;
      
      try {
        setLoading(true);
        setError(null);

        // Handle both absolute and relative URLs
        const fullUrl = url.startsWith('http') ? url : window.location.origin + url;
        
        // Load the PDF document with retry mechanism
        const loadingTask = pdfjsLib.getDocument({
          url: fullUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/cmaps/',
          cMapPacked: true,
        });

        // Add progress callback
        loadingTask.onProgress = (progress: PDFProgress) => {
          const percentage = progress.loaded / progress.total * 100;
          console.log(`Loading PDF: ${Math.round(percentage)}%`);
        };

        pdfDocRef.current = await loadingTask.promise;
        setTotalPages(pdfDocRef.current.numPages);
        await renderPage(1);
      } catch (err) {
        console.error('Error loading PDF:', err);
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadPDF(), 1000); // Retry after 1 second
        } else {
          setError('Failed to load PDF document. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPDF();
  }, [url, retryCount]);

  const renderPage = async (pageNumber: number) => {
    if (!canvasRef.current || !pdfDocRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // Cancel any ongoing render operation
      if (renderTaskRef.current) {
        await renderTaskRef.current.promise.catch(() => {});
        renderTaskRef.current = null;
      }

      const page = await pdfDocRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale, rotation });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('Could not get canvas context');
      }

      // High DPI display support
      const pixelRatio = window.devicePixelRatio || 1;
      canvas.width = viewport.width * pixelRatio;
      canvas.height = viewport.height * pixelRatio;
      canvas.style.width = viewport.width + "px";
      canvas.style.height = viewport.height + "px";

      // Clear the canvas before rendering
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Scale the context for high DPI displays
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        enableWebGL: true,
      };

      // Store the new render task
      renderTaskRef.current = page.render(renderContext);

      // Wait for the render to complete
      await renderTaskRef.current.promise;
      renderTaskRef.current = null;
      setCurrentPage(pageNumber);
    } catch (err) {
      console.error('Error rendering page:', err);
      setError('Failed to render page');
      renderTaskRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage < 1 || newPage > totalPages) return;
    
    setLoading(true);
    await renderPage(newPage);
    setCurrentPage(newPage);
    setLoading(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 text-red-600 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <canvas ref={canvasRef} className="mx-auto" />
      </div>
      
      <div className="flex items-center justify-between p-4 border-t border-border-subtle">
        <button
          onClick={() => handlePageChange(-1)}
          disabled={currentPage <= 1 || loading}
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        
        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
        
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage >= totalPages || loading}
          className="p-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}