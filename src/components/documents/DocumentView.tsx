import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDocuments } from '../../contexts/DocumentContext';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { formatPDFDate } from '../../utils/dateFormatter';
import DocumentChat from './DocumentChat';
import PDFViewer from './PDFViewer';
import { DocumentMetadata } from '../../services/DocumentService';

export default function DocumentView(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { getDocument, documentService } = useDocuments();
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const doc = getDocument(id || '');

  useEffect(() => {
    const load = async () => {
      if (!doc) return;
      setLoading(true);
      try {
        if (documentService) {
          const meta = await documentService.getDocumentMetadata(doc);
          setMetadata(meta);
        }
      } catch (err) {
        console.error('Failed to load document metadata', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [doc, documentService]);

  if (!doc) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-muted mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-heading mb-2">Document not found</h2>
          <p className="text-text mb-4">The document you're looking for doesn't exist.</p>
          <Link to="/dashboard" className="text-primary hover:text-primary-700 font-medium">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const summaryText = doc.summary || metadata?.summary || '';

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="bg-surface border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center text-primary hover:text-primary-700 font-medium">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Link>

            <div className="flex items-center space-x-3">
              <a
                href={doc.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
              <button onClick={() => setChatOpen(true)} className="flex items-center px-4 py-2 bg-accent-start text-white rounded-lg hover:bg-accent-end transition-colors font-medium">
                Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* PDF Viewer */}
            <PDFViewer url={doc.path} />
            
            {/* Document Info */}
            <div className="flex bg-surface rounded-xl shadow-sm overflow-hidden">
              <div className="w-3 bg-gradient-to-b from-accent-start to-accent-end"></div>
              <div className="flex-1 p-8">
                <div className="flex items-center mb-6">
                    <div className="bg-bg-page p-3 rounded-lg mr-4 mb-3 sm:mb-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div title={doc.category} className="inline-flex items-center justify-center px-2 sm:px-3 py-1 border border-black text-black rounded text-xs sm:text-sm font-bold max-w-[12rem] overflow-hidden">
                      <span className="truncate">{doc.category || 'Uncategorized'}</span>
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-heading mb-6">{doc.name}</h1>

                <div className="prose max-w-none">
                  {summaryText ? (
                    <div className="space-y-6">
                      <div className="p-6 rounded-lg bg-bg-page">
                        <h3 className="text-xl font-semibold text-heading mb-4">Summary</h3>
                        <div className="text-text">
                          {summaryText.split('\n\n').map((para, idx) => (
                            <p key={idx} className="mb-3">{para}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg bg-bg-page">
                      <p className="text-text">
                        {loading ? 'Loading document information...' : 'Document Status: ' + (doc.processingStatus ?? 'idle')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-surface rounded-xl shadow-sm overflow-hidden">
              <div className="w-full h-2 bg-gradient-to-r from-accent-start to-accent-end"></div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-heading mb-4">Document Details</h3>

                <div className="space-y-4">
                  {metadata ? (
                    <>
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted mr-3" />
                        <div>
                          <p className="text-sm text-muted">File Type</p>
                          <p className="font-medium text-text">{doc.type}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted mr-3" />
                        <div>
                          <p className="text-sm text-muted">File Size</p>
                          <p className="font-medium text-text">{metadata.fileSize}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted mr-3" />
                        <div>
                          <p className="text-sm text-muted">Pages</p>
                          <p className="font-medium text-text">{metadata.pageCount}</p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-muted mr-3" />
                        <div>
                          <p className="text-sm text-muted">Author</p>
                          <p className="font-medium text-text">{metadata.author}</p>
                        </div>
                      </div>

                      {metadata.creationDate && (
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-muted mr-3" />
                          <div>
                            <p className="text-sm text-muted">Created</p>
                            <p className="font-medium text-text">{formatPDFDate(metadata.creationDate)}</p>
                          </div>
                        </div>
                      )}

                      {metadata.keywords && metadata.keywords.length > 0 && (
                        <div>
                          <p className="text-sm text-muted mb-2">Keywords</p>
                          <div className="flex flex-wrap gap-2">
                            {metadata.keywords.map((keyword, index) => (
                              <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-muted mr-3" />
                      <div>
                        <p className="text-sm text-muted">File Type</p>
                        <p className="font-medium text-text">{doc.type}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {chatOpen && <DocumentChat docId={doc.id} onClose={() => setChatOpen(false)} />}
          </div>
        </div>
      </div>
    </div>
  );
}