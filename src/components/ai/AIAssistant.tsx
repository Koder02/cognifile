import React, { useState } from 'react';
import { AIService, ClassificationResult } from '../../services/AIService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [text, setText] = useState('');
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClassify = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const aiService = AIService.getInstance();
      const ready = await aiService.isReady();
      if (!ready) {
        setError('AI model not available right now. Try again later or continue with local summaries.');
        console.warn('AI model not ready; classification skipped');
        setResults([]);
        return;
      }

      const classifications = await aiService.classifyDocument(text);
      setResults(classifications);
    } catch (err) {
      setError('Failed to analyze text. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#0C2C47]">AI Assistant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to analyze..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#0C2C47] focus:border-transparent"
          />

          {error && (
            <div className="mt-2 text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleClassify}
            disabled={isLoading}
            className="mt-4 w-full bg-[#0C2C47] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#1a3a57] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Text'}
          </button>

          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Analysis Results:</h3>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">{result.label}</span>
                    <span className="text-gray-600">
                      {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
