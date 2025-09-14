import { useState, useRef, useEffect } from 'react';
import { Search, Filter, X, Calendar, Check } from 'lucide-react';
import SearchBar from './SearchBar';

interface FilterOptions {
  category?: string;
}

interface EnhancedSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
  placeholder?: string;
}

export default function EnhancedSearchBar({
  value,
  onChange,
  onFilterChange,
  categories,
  placeholder
}: EnhancedSearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({});
  const filterMenuRef = useRef<HTMLDivElement>(null);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key];
    } else {
      newFilters[key] = value;
    }
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  // Close filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full relative">
      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <SearchBar value={value} onChange={onChange} placeholder={placeholder} />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors flex items-center ${
                showFilters
                  ? 'bg-[#2563EB] text-white'
                  : 'hover:bg-[#E5E7EB] text-[#374151]'
              }`}
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="ml-1 bg-[#DBEAFE] text-[#2563EB] text-xs px-1.5 rounded-full">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div 
          ref={filterMenuRef}
          className="absolute right-0 mt-2 w-80 bg-[#F9FAFB] rounded-xl shadow-lg border border-gray-200 z-50"
        >
          <div className="p-4">
            <div className="flex justify-end mb-3">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[#374151] hover:text-[#111827] inline-flex items-center"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white text-[#374151]"
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}