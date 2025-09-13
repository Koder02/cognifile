import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '../../contexts/DocumentContext';
import { ArrowLeft, Download, Share2, Tag, User, Calendar, FileText, DollarSign, Users, Scale, Contact as FileContract, Receipt } from 'lucide-react';

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const { getDocument } = useDocuments();
  
  const document = getDocument(id || '');

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Document not found</h2>
          <p className="text-gray-600 mb-4">The document you're looking for doesn't exist.</p>
          <Link
            to="/dashboard"
            className="text-[#0C2C47] hover:text-[#2D5652] font-medium"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Finance': return DollarSign;
      case 'HR': return Users;
      case 'Legal': return Scale;
      case 'Contracts': return FileContract;
      case 'Invoices': return Receipt;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Finance': return 'bg-green-100 text-green-700';
      case 'HR': return 'bg-blue-100 text-blue-700';
      case 'Legal': return 'bg-purple-100 text-purple-700';
      case 'Contracts': return 'bg-orange-100 text-orange-700';
      case 'Technical Reports': return 'bg-indigo-100 text-indigo-700';
      case 'Invoices': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const CategoryIcon = getCategoryIcon(document.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/dashboard"
              className="flex items-center text-[#0C2C47] hover:text-[#2D5652] font-medium"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>
            
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 text-gray-600 hover:text-[#0C2C47] hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
              <button className="flex items-center px-4 py-2 bg-[#E2A54D] text-white rounded-lg hover:bg-[#d4943a] transition-colors font-medium">
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-[#0C2C47] p-3 rounded-lg mr-4">
                  <CategoryIcon className="h-6 w-6 text-white" />
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(document.category)}`}>
                  {document.category}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-[#0C2C47] mb-6">{document.title}</h1>
              
              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">AI-Generated Summary</h3>
                <p className="text-gray-700 leading-relaxed mb-8 bg-[#E4F2EA] p-4 rounded-lg">
                  {document.summary}
                </p>
                
                <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Document Content</h3>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-600 italic text-center">
                    Full document content would be displayed here in a production environment.
                    This demo shows the extracted metadata and AI-generated summary.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Document Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Author</p>
                    <p className="font-medium text-[#0C2C47]">{document.author}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Upload Date</p>
                    <p className="font-medium text-[#0C2C47]">
                      {new Date(document.uploadDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">File Type & Size</p>
                    <p className="font-medium text-[#0C2C47]">{document.fileType} • {document.size}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Extracted Entities</h3>
              
              <div className="space-y-2">
                {document.entities.map((entity, index) => (
                  <div key={index} className="bg-[#97D3CD] bg-opacity-20 px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium text-[#0C2C47]">{entity}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Tags</h3>
              
              <div className="flex flex-wrap gap-2">
                {document.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center px-3 py-1 bg-[#E4F2EA] text-[#2D5652] text-sm rounded-full">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}