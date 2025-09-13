import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = "Search documents..." }: SearchBarProps) {
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
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          <div className="p-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              AI-powered semantic search results for: <strong>"{value}"</strong>
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-500">
              Searching through document content, metadata, and extracted entities...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}