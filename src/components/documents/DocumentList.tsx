import { useState, useEffect } from 'react';
import { DocumentInfo } from '../../services/DocumentService';
import DocumentCard from './DocumentCard';
import DocumentSkeleton from './DocumentSkeleton';
import { FileX, Loader2 } from 'lucide-react';


interface DocumentListProps {
  documents: DocumentInfo[];
  searchQuery?: string;
  isLoading?: boolean;
}

export default function DocumentList({ documents, searchQuery, isLoading = false }: DocumentListProps) {
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <DocumentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileX className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {searchQuery ? 'No documents found' : 'No documents available'}
        </h3>
        <p className="text-gray-600">
          {searchQuery 
            ? `No documents match your search for "${searchQuery}"`
            : 'Upload your first document to get started with AI-powered classification'
          }
        </p>
      </div>
    );
  }

  const [sortedDocs, setSortedDocs] = useState(documents);
  const [sortBy, setSortBy] = useState('uploadDate');

  useEffect(() => {
    const sortDocs = () => {
      const sorted = [...documents].sort((a, b) => {
        switch (sortBy) {
          case 'uploadDate':
            return new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime();
          case 'title':
            return a.name.localeCompare(b.name);
          case 'category':
            return (a.category || '').localeCompare(b.category || '');
          case 'author':
            return (a.metadata?.author || '').localeCompare(b.metadata?.author || '');
          default:
            return 0;
        }
      });
      setSortedDocs(sorted);
    };

    sortDocs();
  }, [documents, sortBy]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0C2C47]">
          {searchQuery ? `Search Results (${documents.length})` : `Documents (${documents.length})`}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Sort by:</span>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-[#0C2C47] focus:border-transparent"
          >
            <option value="uploadDate">Upload Date</option>
            <option value="title">Title</option>
            <option value="category">Category</option>
            <option value="author">Author</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedDocs.map(document => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}