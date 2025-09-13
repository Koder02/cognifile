import React, { createContext, useContext, useState } from 'react';

export interface Document {
  id: string;
  title: string;
  category: 'Finance' | 'HR' | 'Legal' | 'Contracts' | 'Technical Reports' | 'Invoices';
  author: string;
  uploadDate: string;
  fileType: string;
  fileName: string;
  summary: string;
  entities: string[];
  content: string;
  uploaderId: string;
  size: string;
  tags: string[];
}

interface DocumentContextType {
  documents: Document[];
  addDocument: (doc: Document) => void;
  getDocument: (id: string) => Document | undefined;
  searchDocuments: (query: string) => Document[];
  filterDocuments: (filters: FilterOptions) => Document[];
}

interface FilterOptions {
  category?: string;
  author?: string;
  dateRange?: { start: string; end: string };
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Mock documents for demo
const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Q4 Financial Report 2023',
    category: 'Finance',
    author: 'Sarah Johnson',
    uploadDate: '2024-01-15',
    fileType: 'PDF',
    fileName: 'Q4_Financial_Report_2023.pdf',
    summary: 'Comprehensive quarterly financial analysis showing 15% revenue growth, improved profit margins, and strategic investment outcomes for Q4 2023.',
    entities: ['Revenue: $2.5M', 'Profit Margin: 18%', 'Q4 2023'],
    content: 'Full financial report content...',
    uploaderId: '3',
    size: '2.4 MB',
    tags: ['quarterly', 'revenue', 'profits']
  },
  {
    id: '2',
    title: 'Employee Handbook Update',
    category: 'HR',
    author: 'Mike Chen',
    uploadDate: '2024-01-10',
    fileType: 'DOCX',
    fileName: 'Employee_Handbook_v3.docx',
    summary: 'Updated employee handbook covering remote work policies, benefits changes, and new performance evaluation criteria effective January 2024.',
    entities: ['Remote Work Policy', 'Benefits Package', 'Performance Review'],
    content: 'Employee handbook content...',
    uploaderId: '2',
    size: '1.8 MB',
    tags: ['policies', 'remote work', 'benefits']
  },
  {
    id: '3',
    title: 'Software License Agreement',
    category: 'Legal',
    author: 'Jennifer Williams',
    uploadDate: '2024-01-08',
    fileType: 'PDF',
    fileName: 'Software_License_Agreement.pdf',
    summary: 'Enterprise software licensing agreement for AI development tools, including usage rights, limitations, and renewal terms.',
    entities: ['License Duration: 3 years', 'Enterprise License', 'AI Development Tools'],
    content: 'Legal agreement content...',
    uploaderId: '4',
    size: '890 KB',
    tags: ['software', 'licensing', 'AI tools']
  },
  {
    id: '4',
    title: 'Technical Architecture Proposal',
    category: 'Technical Reports',
    author: 'David Rodriguez',
    uploadDate: '2024-01-05',
    fileType: 'PDF',
    fileName: 'Tech_Architecture_Proposal_2024.pdf',
    summary: 'Proposed technical architecture for scalable AI document processing system, including microservices design and cloud infrastructure requirements.',
    entities: ['Microservices', 'Cloud Infrastructure', 'AI Processing'],
    content: 'Technical proposal content...',
    uploaderId: '5',
    size: '3.2 MB',
    tags: ['architecture', 'microservices', 'AI']
  }
];

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);

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
      doc.title.toLowerCase().includes(lowercaseQuery) ||
      doc.summary.toLowerCase().includes(lowercaseQuery) ||
      doc.content.toLowerCase().includes(lowercaseQuery) ||
      doc.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  const filterDocuments = (filters: FilterOptions): Document[] => {
    return documents.filter(doc => {
      if (filters.category && doc.category !== filters.category) return false;
      if (filters.author && doc.author !== filters.author) return false;
      if (filters.dateRange) {
        const docDate = new Date(doc.uploadDate);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (docDate < startDate || docDate > endDate) return false;
      }
      return true;
    });
  };

  return (
    <DocumentContext.Provider value={{
      documents,
      addDocument,
      getDocument,
      searchDocuments,
      filterDocuments
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
}