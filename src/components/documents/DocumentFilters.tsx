import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface FilterOptions {
  category?: string;
  author?: string;
  dateRange?: { start: string; end: string };
}

interface DocumentFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
  authors: string[];
}

export default function DocumentFilters({ onFilterChange, categories, authors }: DocumentFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({});

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '') {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (key: 'start' | 'end', value: string) => {
    const dateRange = { ...filters.dateRange, [key]: value };
    if (!dateRange.start && !dateRange.end) {
      const newFilters = { ...filters };
      delete newFilters.dateRange;
      setFilters(newFilters);
      onFilterChange(newFilters);
    } else {
      const newFilters = { ...filters, dateRange };
      setFilters(newFilters);
      onFilterChange(newFilters);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#172D9D] to-[#787CFE] p-4 rounded-lg mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-white text-sm font-medium mb-2">Category</label>
          <select
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#172D9D]"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Author</label>
          <select
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#172D9D]"
            value={filters.author || ''}
            onChange={(e) => handleFilterChange('author', e.target.value)}
          >
            <option value="">All Authors</option>
            {authors.map(author => (
              <option key={author} value={author}>{author}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-white text-sm font-medium mb-2">Date Range</label>
          <div className="flex space-x-2">
            <input
              type="date"
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#172D9D]"
              value={filters.dateRange?.start || ''}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
            />
            <input
              type="date"
              className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#172D9D]"
              value={filters.dateRange?.end || ''}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}