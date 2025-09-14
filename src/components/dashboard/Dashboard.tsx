import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DocumentList from '../documents/DocumentList';
import EnhancedSearchBar from '../search/EnhancedSearchBar';
import UploadModal from '../upload/UploadModal';
import { useDocuments } from '../../contexts/DocumentContext';
import { useAuth } from '../../contexts/AuthContext';

interface FilterOptions {
  category?: string;
}

export default function Dashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Use filters.category as the selected category to keep sidebar and filter dropdown in sync
  const selectedCategory = filters.category || '';
  
  // Handle home button click to show all documents
  const handleHomeClick = () => {
    setFilters({});  // Clear all filters
    setSearchQuery(''); // Clear search
  };

  // Listen for custom event to open upload modal
  React.useEffect(() => {
    const handleOpenUpload = () => setIsUploadModalOpen(true);
    window.addEventListener('openUploadModal', handleOpenUpload);
    return () => window.removeEventListener('openUploadModal', handleOpenUpload);
  }, []);
  
    const { documents, searchDocuments, loading } = useDocuments();
  const { user } = useAuth();

  // Get unique categories for filters
  const categories = useMemo(() => {
    return [...new Set(documents.map(doc => doc.category))].filter(Boolean) as string[];
  }, [documents]);

  const getFilteredDocuments = () => {
    let filteredDocs = documents;

    // Role-based filtering
    if (user?.role !== 'Admin') {
      filteredDocs = filteredDocs.filter(doc => {
        // allow showing documents still processing (Uncategorized)
        if (!doc.category || doc.category === 'Uncategorized') return true;
        switch (user?.role) {
          case 'HR':
            return doc.category === 'HR';
          case 'Finance':
            return doc.category === 'Finance' || doc.category === 'Invoices';
          case 'Legal':
            return doc.category === 'Legal' || doc.category === 'Contracts';
          case 'Technical':
            return doc.category === 'Tech';
          default:
            return true;
        }
      });
    }

    // Search filtering
    if (searchQuery.trim()) {
      filteredDocs = searchDocuments(searchQuery);
    }

    // Apply category filter
    if (filters.category) {
      filteredDocs = filteredDocs.filter(doc => doc.category === filters.category);
    }

    return filteredDocs;
  };

  return (
    <div className="flex h-screen bg-[#F3F4F6]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedCategory={selectedCategory}
        onCategorySelect={(category) => setFilters(prev => ({ ...prev, category }))}
        onHomeClick={handleHomeClick}
      />      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <EnhancedSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onFilterChange={setFilters}
                categories={categories}
                placeholder="Search documents by content, title, or tags..."
              />
            </div>
            
            <DocumentList 
              documents={getFilteredDocuments()}
              searchQuery={searchQuery}
              isLoading={loading}
            />
          </div>
        </div>
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}