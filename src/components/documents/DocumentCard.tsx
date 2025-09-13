import React from 'react';
import { Link } from 'react-router-dom';
import { Document } from '../../contexts/DocumentContext';
import { FileText, User, Calendar, Tag, Download, Eye, DollarSign, Users, Scale, Contact as FileContract, Receipt } from 'lucide-react';

interface DocumentCardProps {
  document: Document;
}

export default function DocumentCard({ document }: DocumentCardProps) {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-[#0C2C47] p-2 rounded-lg mr-3">
              <CategoryIcon className="h-5 w-5 text-white" />
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(document.category)}`}>
              {document.category}
            </span>
          </div>
        </div>
        
        <h3 className="font-bold text-[#0C2C47] mb-2 line-clamp-2">{document.title}</h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{document.summary}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>{document.author}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(document.uploadDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FileText className="h-4 w-4 mr-2" />
            <span>{document.fileType} • {document.size}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {document.tags.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-1 bg-[#E4F2EA] text-[#2D5652] text-xs rounded-full">
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            to={`/document/${document.id}`}
            className="flex items-center px-3 py-2 text-[#0C2C47] hover:bg-[#E4F2EA] rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
          <button className="flex items-center px-3 py-2 text-gray-600 hover:text-[#0C2C47] hover:bg-gray-100 rounded-lg transition-colors text-sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}