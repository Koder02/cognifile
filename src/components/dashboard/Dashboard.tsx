import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DocumentList from '../documents/DocumentList';
import SearchBar from '../search/SearchBar';
import UploadModal from '../upload/UploadModal';
import { useDocuments } from '../../contexts/DocumentContext';
import { useAuth } from '../../contexts/AuthContext';

export default function Dashboard() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { documents, searchDocuments, filterDocuments } = useDocuments();
  const { user } = useAuth();

  const getFilteredDocuments = () => {
    let filteredDocs = documents;

    // Role-based filtering
    if (user?.role !== 'Admin') {
      filteredDocs = filteredDocs.filter(doc => {
        switch (user?.role) {
          case 'HR':
            return doc.category === 'HR';
          case 'Finance':
            return doc.category === 'Finance' || doc.category === 'Invoices';
          case 'Legal':
            return doc.category === 'Legal' || doc.category === 'Contracts';
          case 'Technical':
            return doc.category === 'Technical Reports';
          default:
            return true;
        }
      });
    }

    // Search filtering
    if (searchQuery.trim()) {
      filteredDocs = searchDocuments(searchQuery);
    }

    // Category filtering
    if (selectedCategory) {
      filteredDocs = filteredDocs.filter(doc => doc.category === selectedCategory);
    }

    return filteredDocs;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onUploadClick={() => setIsUploadModalOpen(true)}
        />
        
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search documents by content, title, or tags..."
              />
            </div>
            
            <DocumentList 
              documents={getFilteredDocuments()}
              searchQuery={searchQuery}
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