import { Link } from 'react-router-dom';
import { DocumentInfo } from '../../services/DocumentService';
import { FileText, File, Calendar, Download, Eye } from 'lucide-react';
import { formatPDFDate, formatUploadDate } from '../../utils/dateFormatter';

interface DocumentCardProps {
  document: DocumentInfo;
}

export default function DocumentCard({ document }: DocumentCardProps) {
  // Keep only the category badge; status labels removed per request
  const categoryLabel = document.category || document.classification || 'Uncategorized';

  return (
    <div className="flex bg-surface rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className="w-3 bg-gradient-to-b from-accent-start to-accent-end"></div>
      <div className="flex-1 p-6">
  <div className="flex flex-col sm:flex-row items-start sm:justify-between mb-4">
          {document.thumbnail ? (
            <img 
              src={document.thumbnail} 
              alt={document.name}
              className="w-24 h-24 object-contain bg-bg-page rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 flex items-center justify-center bg-bg-page rounded-lg">
              <FileText className="h-8 w-8 text-muted" />
            </div>
          )}
          
          <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0">
            <div className="flex items-center">
              <div title={document.category} className="inline-flex items-center justify-center px-2 sm:px-3 py-1 border border-black text-black rounded text-xs sm:text-sm font-bold max-w-[10rem] overflow-hidden">
                <span className="truncate">{categoryLabel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-heading mb-2 line-clamp-2">{document.name}</h3>
          {document.summary && (
            <p className="text-sm text-text line-clamp-3">{document.summary}</p>
          )}
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-muted">
            <File className="h-4 w-4 mr-2" />
            <span>{document.type}</span>
          </div>
          <div className="flex items-center text-sm text-muted">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Uploaded {formatUploadDate(document.uploadDate || new Date().toISOString())}</span>
          </div>
          {document.metadata?.creationDate && (
            <div className="flex items-center text-sm text-muted">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Created {formatPDFDate(document.metadata.creationDate)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <Link
            to={`/document/${document.id}`}
            className="flex items-center px-3 py-2 text-primary hover:text-primary-700 hover:bg-primary/5 rounded-lg transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
          <a
            href={document.path}
            download={document.name}
            className="flex items-center px-3 py-2 text-muted hover:text-text hover:bg-bg-page rounded-lg transition-colors text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
}