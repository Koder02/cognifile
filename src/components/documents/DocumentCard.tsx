import { Link } from 'react-router-dom';
import { DocumentInfo } from '../../services/DocumentService';
import { FileText, Loader2, File, Calendar, Download, Eye } from 'lucide-react';

interface DocumentCardProps {
  document: DocumentInfo;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  const getStatusColor = (status?: 'idle' | 'processing' | 'completed' | 'error') => {
    switch (status) {
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          {document.thumbnail ? (
            <img 
              src={document.thumbnail} 
              alt={document.name}
              className="w-24 h-24 object-contain bg-gray-50 rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          )}
          
          <div className="flex flex-col items-end">
            <span className={`text-sm ${getStatusColor(document.processingStatus)}`}>
              {document.processingStatus === 'processing' ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </div>
              ) : document.processingStatus === 'completed' ? (
                document.classification || 'Processed'
              ) : document.processingStatus === 'error' ? (
                'Analysis failed'
              ) : (
                'Waiting...'
              )}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-[#0C2C47] mb-2 line-clamp-2">{document.name}</h3>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <File className="h-4 w-4 mr-2" />
            <span>{document.type}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date().toLocaleDateString()}</span>
          </div>
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