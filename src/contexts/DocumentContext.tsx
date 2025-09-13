import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { DocumentService } from '../services/DocumentService';

export interface Document {
  id: string;
  title?: string;
  category?: string;
  author?: string;
  uploadDate?: string;
  summary?: string;
  entities?: string[];
  content?: string;
  size?: string;
  tags?: string[];
  confidenceScore?: number;
  type: string;
  path: string;
  name: string;
  processingStatus?: string;
  classification?: string;
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Document) => void;
  getDocument: (id: string) => Document | undefined;
  searchDocuments: (query: string) => Document[];
  filterDocuments: (filters: FilterOptions) => Document[];
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
  const [documents, setDocuments] = useState<Document[]>([]);
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

  const addDocument = (doc: Document) => {
    setDocuments(prev => [...prev, doc]);
  };

  const getDocument = (id: string) => {
    return documents.find(doc => doc.id === id);
  };

  const searchDocuments = (query: string): Document[] => {
    if (!query.trim()) return documents;
    
    const lowercaseQuery = query.toLowerCase();
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(lowercaseQuery) ||
      doc.classification?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const filterDocuments = (filters: FilterOptions): Document[] => {
    return documents.filter(doc => {
      if (filters.category && doc.classification !== filters.category) return false;
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

