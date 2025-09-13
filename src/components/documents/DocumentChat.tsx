import React, { useState } from 'react';
import QAService from '../../services/QAService';

interface Props {
  docId?: string;
  onClose: () => void;
}

export default function DocumentChat({ docId, onClose }: Props) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await QAService.ask(question, docId);
      setAnswer(res.answer || 'No answer found');
    } catch (e: unknown) {
      setError((e as Error).message || 'QA failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chat with Document</h3>
          <button onClick={onClose} className="text-gray-500">Close</button>
        </div>

        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="w-full border p-2 rounded mb-3"
          placeholder="Ask a question about this document..."
        />

        <div className="flex gap-3">
          <button onClick={ask} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Thinking...' : 'Ask'}
          </button>
          <button onClick={() => { setQuestion(''); setAnswer(''); }} className="px-4 py-2 border rounded">Reset</button>
        </div>

        {error && <div className="mt-4 text-red-600">{error}</div>}

        {answer && (
          <div className="mt-4 bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Answer</h4>
            <p>{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
