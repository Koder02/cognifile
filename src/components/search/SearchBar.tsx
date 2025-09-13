import { useState, useEffect, useRef } from 'react';
import { SearchService } from '../../services/SearchService';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search documents..." }: SearchBarProps) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const svc = SearchService.getInstance();
        const res = await svc.semanticSearch(value, 6);
        setResults(res);
      } catch (e) {
        console.warn('Search failed', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value]);
  return (
    <div className="relative">
      <div className="flex items-center bg-white rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-[#0C2C47] focus-within:border-transparent transition-all duration-200 shadow-sm">
        <Search className="h-5 w-5 text-gray-400 ml-4" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-transparent border-0 focus:outline-none text-gray-900 placeholder-gray-500"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-2 text-gray-400 hover:text-gray-600 mr-2"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="h-6 w-px bg-gray-200 mr-3" />
        <button className="flex items-center px-4 py-2 text-gray-600 hover:text-[#0C2C47] transition-colors mr-2">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>
      
      {value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-96 overflow-auto">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              AI-powered semantic search results for: <strong>"{value}"</strong>
            </p>
            {loading && <span className="text-xs text-gray-400">Searching...</span>}
          </div>
          <div className="p-2">
            {results.length === 0 && !loading ? (
              <p className="text-xs text-gray-500 p-3">No results</p>
            ) : (
              results.map((r, i) => (
                <a key={r.id + i} href={r.path} className="block px-3 py-2 hover:bg-gray-50 border-b last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-[#0C2C47]">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.category || 'Unknown'}</div>
                    </div>
                    <div className="text-xs text-gray-400">{(r.relevanceScore || r.confidence || 0).toFixed(2)}</div>
                  </div>
                  {r.snippet && <div className="text-xs text-gray-600 mt-1">{r.snippet}</div>}
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}