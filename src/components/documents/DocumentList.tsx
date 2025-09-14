// React is in scope via JSX runtime; no explicit import required
import { DocumentInfo } from '../../services/DocumentService';
import DocumentCard from './DocumentCard';
import { FileX } from 'lucide-react';



interface DocumentListProps {
  documents: DocumentInfo[];
  searchQuery?: string;
}

export default function DocumentList({ documents, searchQuery }: DocumentListProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0C2C47]">
          {searchQuery ? `Search Results (${documents.length})` : `Documents (${documents.length})`}
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Sort by:</span>
          <select className="border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-[#0C2C47] focus:border-transparent">
            <option>Upload Date</option>
            <option>Title</option>
            <option>Category</option>
            <option>Author</option>
          </select>
        </div>
      </div>



      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.map(document => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}