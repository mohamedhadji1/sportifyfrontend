import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';
import './SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  filters = [], 
  sortOptions = [], 
  placeholder = "Search...",
  className = "" 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);  const [isInitialized, setIsInitialized] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const triggerSearch = useCallback((search, sort, order, filters) => {
    try {
      const searchParams = {
        search: search || '',
        sortBy: sort || '',
        sortOrder: order || 'asc',
        ...(filters || {})
      };
      
      if (onSearch && typeof onSearch === 'function') {
        onSearch(searchParams);
      }
    } catch (error) {
      console.error('Error triggering search:', error);
    }
  }, [onSearch]);
  // Initialize filters only once - NO automatic search trigger
  useEffect(() => {
    try {
      if (!isInitialized && Array.isArray(filters) && filters.length > 0) {
        const initialFilters = {};
        filters.forEach(filter => {
          if (filter?.key) {
            initialFilters[filter.key] = filter.defaultValue || 'all';
          }
        });
        setActiveFilters(initialFilters);
        setIsInitialized(true);
        
        // DON'T trigger search during initialization - let the parent handle initial load
      } else if (!isInitialized) {
        // Even with no filters, initialize with empty state
        setIsInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing filters:', error);
      setIsInitialized(true);
      setActiveFilters({});
    }
  }, [filters, isInitialized]); // Remove triggerSearch from dependencies

  // Debounced search for all changes - only after user interaction
  useEffect(() => {
    if (!isInitialized || !hasUserInteracted) {
      return;
    }
    
    const timeoutId = setTimeout(() => {
      triggerSearch(searchTerm, sortBy, sortOrder, activeFilters);
    }, 500); // Increased debounce time to reduce requests
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [searchTerm, sortBy, sortOrder, activeFilters, isInitialized, hasUserInteracted, triggerSearch]);
  const handleFilterChange = (filterKey, value) => {
    try {
      if (!filterKey || value === undefined) return;
      
      setHasUserInteracted(true);
      const newFilters = {
        ...activeFilters,
        [filterKey]: value
      };
      setActiveFilters(newFilters);
      // Don't call triggerSearch directly - let the useEffect handle it with debouncing
    } catch (error) {
      console.error('Error handling filter change:', error);
    }
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    try {
      setHasUserInteracted(true);
      setSortBy(newSortBy || '');
      setSortOrder(newSortOrder || 'asc');
      // Don't call triggerSearch directly - let the useEffect handle it with debouncing
    } catch (error) {
      console.error('Error handling sort change:', error);
    }
  };

  const clearAllFilters = () => {
    try {
      setHasUserInteracted(true);
      setSearchTerm('');
      const clearedFilters = {};
      if (Array.isArray(filters)) {
        filters.forEach(filter => {
          if (filter?.key) {
            clearedFilters[filter.key] = 'all';
          }
        });
      }
      setActiveFilters(clearedFilters);
      setSortBy('');
      setSortOrder('asc');
      // Don't call triggerSearch directly - let the useEffect handle it with debouncing
    } catch (error) {
      console.error('Error clearing filters:', error);
    }
  };

  const hasActiveFilters = () => {
    return searchTerm || 
           Object.values(activeFilters).some(value => value !== 'all') ||
           sortBy;
  };

  return (
    <div className={`bg-card rounded-lg p-4 mb-6 border border-border ${className}`}>
      {/* Search Input */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              try {
                setHasUserInteracted(true);
                setSearchTerm(e.target.value || '');
              } catch (error) {
                console.error('Error handling search input:', error);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => {
                try {
                  setSearchTerm('');
                } catch (error) {
                  console.error('Error clearing search:', error);
                }
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showFilters 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'bg-secondary border-border text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>

        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 bg-destructive hover:bg-destructive/80 text-destructive-foreground rounded-lg transition-colors"
          >
            <X size={16} />
            Clear
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="border-t border-border pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dynamic Filters */}
            {Array.isArray(filters) && filters.map((filter) => (
              filter?.key && filter?.label ? (
                <div key={filter.key} className="space-y-2">
                  <label className="block text-sm font-medium text-card-foreground">
                    {filter.label}
                  </label>
                  <select
                    value={activeFilters[filter.key] || 'all'}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="all">All {filter.label}</option>
                    {Array.isArray(filter.options) && filter.options.map((option) => (
                      option?.value && option?.label ? (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ) : null
                    ))}
                  </select>
                </div>
              ) : null
            ))}

            {/* Sort Options */}
            {Array.isArray(sortOptions) && sortOptions.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-card-foreground">
                  Sort By
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                    className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Default</option>
                    {sortOptions.map((option) => (
                      option?.value && option?.label ? (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ) : null
                    ))}
                  </select>
                  {sortBy && (
                    <button
                      onClick={() => handleSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="px-3 py-2 bg-secondary border border-border rounded-lg text-secondary-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
