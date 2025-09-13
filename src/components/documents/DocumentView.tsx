import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '../../contexts/DocumentContext';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import DocumentChat from './DocumentChat';
import { DocumentMetadata } from '../../services/DocumentService';

export default function DocumentView() {
  const { id } = useParams<{ id: string }>();
  const { getDocument, documentService } = useDocuments();
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  
  const doc = getDocument(id || '');

  useEffect(() => {
    const loadMetadata = async () => {
      if (!doc) return;
      setLoading(true);
      try {
        if (documentService && doc) {
          const docMetadata = await documentService.getDocumentMetadata(doc);
          setMetadata(docMetadata);
        } else {
          console.warn('documentService not available');
        }
      } catch (error) {
        console.error('Error loading metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetadata();
  }, [doc, documentService]);

  if (!doc) {
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

  // Helpers removed — not needed in this component

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
              <a 
                href={doc.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-[#E2A54D] text-white rounded-lg hover:bg-[#d4943a] transition-colors font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
              <button
                onClick={() => setChatOpen(true)}
                className="flex items-center px-4 py-2 bg-[#0C2C47] text-white rounded-lg hover:bg-[#092537] transition-colors font-medium"
              >
                Chat
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
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {doc.classification || 'Processing...'}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-[#0C2C47] mb-6">{doc.name}</h1>
              
              <div className="prose max-w-none">
                  {metadata ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Summary</h3>
                      <p className="text-gray-600">{metadata.summary}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-600">
                      {loading ? 'Loading document information...' : 'Document Status: ' + (doc.processingStatus ?? 'idle')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-[#0C2C47] mb-4">Document Details</h3>
              
              <div className="space-y-4">
                {metadata ? (
                  <>
                    <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">File Type</p>
                          <p className="font-medium text-[#0C2C47]">{doc.type}</p>
                        </div>
                      </div>

                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">File Size</p>
                        <p className="font-medium text-[#0C2C47]">{metadata.fileSize}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Pages</p>
                        <p className="font-medium text-[#0C2C47]">{metadata.pageCount}</p>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Author</p>
                        <p className="font-medium text-[#0C2C47]">{metadata.author}</p>
                      </div>
                    </div>

                    {metadata.creationDate && (
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium text-[#0C2C47]">{metadata.creationDate}</p>
                        </div>
                      </div>
                    )}

                    {metadata.keywords && metadata.keywords.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Keywords</p>
                        <div className="flex flex-wrap gap-2">
                          {metadata.keywords.map((keyword, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">File Type</p>
                      <p className="font-medium text-[#0C2C47]">{doc.type}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          {chatOpen && <DocumentChat docId={doc.id} onClose={() => setChatOpen(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
}