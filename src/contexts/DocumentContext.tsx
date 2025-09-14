import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentService } from '../services/DocumentService';
import type { DocumentInfo } from '../services/DocumentService';

interface DocumentContextType {
  documents: DocumentInfo[];
  addDocument: (doc: DocumentInfo) => void;
  getDocument: (id: string) => DocumentInfo | undefined;
  searchDocuments: (query: string) => DocumentInfo[];
  filterDocuments: (filters: FilterOptions) => DocumentInfo[];
  loading: boolean;
  error: string | null;
  documentService: DocumentService | null;
}

interface FilterOptions {
  category?: string;
  author?: string;
  dateRange?: { start: string; end: string };
}

export const DocumentContext = createContext<DocumentContextType | undefined>(undefined);



export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const documentService = useMemo(() => {
    try {
      return DocumentService.getInstance();
    } catch (error) {
      console.error('Error getting DocumentService instance:', error);
      return null;
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    if (!documentService) {
      setError('Document service is not available');
      return;
    }
    
    try {
      setLoading(true);
      // loadDocuments now returns initial list quickly and processes in background
      const docs = await documentService.loadDocuments();
      if (!docs) {
        throw new Error('No documents returned from service');
      }
      setDocuments(docs);
      setError(null); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading documents');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  }, [documentService]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Listen for background processed events to update individual documents
  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent;
      const { id, category, summary, content } = custom.detail || {};
      if (!id) return;
      setDocuments(prev => prev.map(d => {
        if (d.id !== id) return d;
        const updated: any = { ...d, category: category || d.category, processingStatus: 'completed' };
        if (summary) updated.summary = summary;
        if (content) updated.content = content;
        return updated;
      }));
    };
    window.addEventListener('documentProcessed', handler as EventListener);
    return () => window.removeEventListener('documentProcessed', handler as EventListener);
  }, []);

  const addDocument = (doc: DocumentInfo) => {
    setDocuments(prev => [...prev, doc]);
  };

  const getDocument = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const searchDocuments = (query: string): DocumentInfo[] => {
    if (!query.trim()) return documents;
    
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.classification?.toLowerCase().includes(lowercaseQuery) ||
      doc.summary?.toLowerCase().includes(lowercaseQuery) ||
      doc.content?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const filterDocuments = (filters: FilterOptions): DocumentInfo[] => {
    return documents.filter(doc => {
      if (filters.category && doc.category !== filters.category) return false;
      return true;
    });
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      addDocument,
      getDocument,
      searchDocuments,
      filterDocuments,
      loading,
      error,
      documentService
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (ctx === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return ctx;
}

