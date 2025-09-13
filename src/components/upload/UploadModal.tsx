import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useDocuments, Document } from '../../contexts/DocumentContext';
import { useAuth } from '../../contexts/AuthContext';
import { AIService } from '../../services/AIService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const { addDocument } = useDocuments();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setUploadStatus('error');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleProcessing = async () => {
    if (!selectedFile || !user) return;

    
    setUploadStatus('processing');

    try {
      const aiService = AIService.getInstance();
      const fileUrl = URL.createObjectURL(selectedFile);

      // Extract text from the PDF
      const text = await aiService.extractTextFromPDF(fileUrl);

      // Classify the document if model is ready; otherwise fallback
      const ready = await aiService.isReady();
            interface Classification {
        label: string;
        score: number;
      }
      let classifications: Classification[] = [];
      let topClassification = { label: 'Other', score: 0 };
      if (ready) {
        classifications = await aiService.classifyDocument(text);
        topClassification = classifications[0] || topClassification;
      } else {
        console.warn('AI model not ready; skipping classification for uploaded file');
      }

      const newDocument: Document = {
        id: Date.now().toString(),
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
        category: topClassification.label,
        author: user.username,
        uploadDate: new Date().toISOString().split('T')[0],
        type: selectedFile.name.split('.').pop()?.toUpperCase() || 'PDF',
        name: selectedFile.name,
        summary: `AI-generated summary for ${selectedFile.name}.`,
        entities: [],
        content: text,
        size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
        tags: ['newly-uploaded'],
        path: fileUrl,
        confidenceScore: topClassification.score,
        classification: topClassification.label,
      };

      addDocument(newDocument);

      setUploadStatus('success');
    } catch (error) {
      console.error('Error processing document:', error);
      setUploadStatus('error');
    } finally {
      
      setTimeout(() => {
        onClose();
        setUploadStatus('idle');
        setSelectedFile(null);
      }, 2000);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#0C2C47]">Upload Document</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">AI will automatically classify and extract metadata</p>
        </div>

        <div className="p-6">
          {uploadStatus === 'idle' && !selectedFile && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-[#0C2C47] bg-[#E4F2EA]' 
                  : 'border-gray-300 hover:border-[#0C2C47]'
              }`}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </h3>
              <p className="text-gray-600 mb-4">
                Supports PDF, DOCX, and TXT files up to 10MB
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileSelect}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-[#0C2C47] text-white rounded-lg hover:bg-[#1a3a57] cursor-pointer transition-colors"
              >
                <FileText className="h-4 w-4 mr-2" />
                Choose File
              </label>
            </div>
          )}

          {selectedFile && uploadStatus === 'idle' && (
            <div className="space-y-4">
              <div className="bg-[#E4F2EA] p-4 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-[#0C2C47] mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-[#0C2C47]">{selectedFile.name}</p>
                    <p className="text-sm text-[#2D5652]">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <button
                    onClick={reset}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessing}
                  className="flex-1 px-4 py-2 bg-[#0C2C47] text-white rounded-lg hover:bg-[#1a3a57] transition-colors"
                >
                  Process Document
                </button>
              </div>
            </div>
          )}

          {uploadStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2C47] mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-[#0C2C47] mb-2">Processing Document</h3>
              <p className="text-gray-600 mb-4">AI is analyzing and classifying your document...</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>✓ File uploaded successfully</p>
                <p>✓ Extracting text content</p>
                <p className="text-[#0C2C47]">⏳ Classifying document type</p>
                <p>⏳ Generating summary</p>
                <p>⏳ Extracting entities</p>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-700 mb-2">Upload Successful!</h3>
              <p className="text-gray-600">Document has been processed and classified</p>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-700 mb-2">Upload Failed</h3>
              <p className="text-gray-600 mb-4">Please check your file format and try again</p>
              <button
                onClick={reset}
                className="px-4 py-2 bg-[#0C2C47] text-white rounded-lg hover:bg-[#1a3a57] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}