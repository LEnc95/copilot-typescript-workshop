'use client';

import { useState, useEffect, useRef, useMemo, useId, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, Grid, List, ChevronDown, X, Clock3 } from "lucide-react";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { Hero, SectionContainer, SectionTitle } from "@/components/ui";
import { AVAILABLE_TAGS } from "@/lib/mock-tag-data";
import { Photo, mockPhotos } from "@/lib/mock-photo-data";

interface SearchSuggestion {
  id: string;
  value: string;
  type: 'title' | 'tag' | 'photographer';
}

interface SearchDropdownItem {
  id: string;
  value: string;
  label: string;
  kind: 'suggestion' | 'recent';
}

const MAX_RECENT_SEARCHES = 5;

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('search') ?? '';
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState<number>(-1);
  const filterRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionListboxId = useId();

  const searchSuggestions: SearchSuggestion[] = useMemo((): SearchSuggestion[] => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return [];
    }

    const seenSuggestionIds: Set<string> = new Set<string>();
    const suggestions: SearchSuggestion[] = [];

    const addSuggestion = (type: SearchSuggestion['type'], value: string): void => {
      const normalizedValue = value.toLowerCase();
      const suggestionId = `${type}-${normalizedValue}`;

      if (!seenSuggestionIds.has(suggestionId)) {
        seenSuggestionIds.add(suggestionId);
        suggestions.push({ id: suggestionId, type, value });
      }
    };

    mockPhotos.forEach((photo: Photo): void => {
      if (photo.title.toLowerCase().includes(normalizedQuery)) {
        addSuggestion('title', photo.title);
      }

      photo.tags.forEach((tag: string): void => {
        if (tag.toLowerCase().includes(normalizedQuery)) {
          addSuggestion('tag', tag);
        }
      });

      if (photo.photographer && photo.photographer.toLowerCase().includes(normalizedQuery)) {
        addSuggestion('photographer', photo.photographer);
      }
    });

    return suggestions.slice(0, 6);
  }, [searchQuery]);

  const searchDropdownItems: SearchDropdownItem[] = useMemo((): SearchDropdownItem[] => {
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery) {
      return searchSuggestions.map((suggestion: SearchSuggestion): SearchDropdownItem => ({
        id: suggestion.id,
        value: suggestion.value,
        label: getSuggestionLabel(suggestion),
        kind: 'suggestion',
      }));
    }

    return recentSearches.map((value: string): SearchDropdownItem => ({
      id: `recent-${value.toLowerCase()}`,
      value,
      label: `Recent: ${value}`,
      kind: 'recent',
    }));
  }, [recentSearches, searchQuery, searchSuggestions]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const searchFromUrl = searchParams.get('search') ?? '';

    setSearchQuery(prev => (prev === searchFromUrl ? prev : searchFromUrl));
    setCurrentPage(1);
    setIsSearchOpen(false);
    setHighlightedSuggestionIndex(-1);
  }, [searchParams]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setHighlightedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLoadMore = async () => {
    setIsLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setCurrentPage(prev => prev + 1);
    setIsLoading(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    // Reset to first page when filters change
    setCurrentPage(1);
  };

  const clearAllTags = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  // Reset page when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    setIsSearchOpen(query.trim().length > 0 || recentSearches.length > 0);
    setHighlightedSuggestionIndex(-1);
  };

  const addRecentSearch = (value: string) => {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return;
    }

    setRecentSearches(prev => {
      const deduped = prev.filter(search => search.toLowerCase() !== normalizedValue.toLowerCase());
      return [normalizedValue, ...deduped].slice(0, MAX_RECENT_SEARCHES);
    });
  };

  const removeRecentSearch = (value: string) => {
    setRecentSearches(prev => prev.filter(search => search !== value));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    setHighlightedSuggestionIndex(-1);
  };

  const applySearchValue = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
    setIsSearchOpen(false);
    setHighlightedSuggestionIndex(-1);
    addRecentSearch(value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      if (!searchDropdownItems.length) {
        return;
      }

      event.preventDefault();
      setIsSearchOpen(true);
      setHighlightedSuggestionIndex(prev => (prev + 1) % searchDropdownItems.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      if (!searchDropdownItems.length) {
        return;
      }

      event.preventDefault();
      setIsSearchOpen(true);
      setHighlightedSuggestionIndex(prev => (prev <= 0 ? searchDropdownItems.length - 1 : prev - 1));
      return;
    }

    if (event.key === 'Enter') {
      if (isSearchOpen && highlightedSuggestionIndex >= 0 && searchDropdownItems[highlightedSuggestionIndex]) {
        event.preventDefault();
        applySearchValue(searchDropdownItems[highlightedSuggestionIndex].value);
        return;
      }

      if (searchQuery.trim()) {
        addRecentSearch(searchQuery);
      }

      setIsSearchOpen(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (event.key === 'Escape') {
      setIsSearchOpen(false);
      setHighlightedSuggestionIndex(-1);
    }
  };

  const getSuggestionLabel = (suggestion: SearchSuggestion): string => {
    if (suggestion.type === 'tag') {
      return `Tag: ${suggestion.value}`;
    }

    if (suggestion.type === 'photographer') {
      return `Photographer: ${suggestion.value}`;
    }

    return `Title: ${suggestion.value}`;
  };

  const showNoResultsState = isSearchOpen && searchQuery.trim().length > 0 && searchDropdownItems.length === 0;

  return (
    <div className="page-gradient">
      <Hero 
        title="Photo Gallery"
        description="Browse and discover amazing photography"
      />

      <SectionContainer className="mb-4">
        {/* Filters and Search */}
        <div className="card-base p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md" ref={searchRef}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (searchDropdownItems.length > 0 || searchQuery.trim().length > 0) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-slate-800/80 pl-11 pr-4 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition shadow-sm hover:shadow-md"
                  aria-label="Search photos"
                  role="combobox"
                  aria-expanded={isSearchOpen && (searchDropdownItems.length > 0 || showNoResultsState)}
                  aria-controls={suggestionListboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    highlightedSuggestionIndex >= 0
                      ? `${suggestionListboxId}-option-${highlightedSuggestionIndex}`
                      : undefined
                  }
                />
              </div>

              {isSearchOpen && (searchDropdownItems.length > 0 || showNoResultsState) && (
                <div className="absolute top-full left-0 right-0 mt-2 card-base border border-slate-300 dark:border-slate-600 shadow-lg z-20 overflow-hidden">
                  {searchDropdownItems.length > 0 && (
                    <div className="flex items-center justify-between px-4 pt-3 pb-1">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {searchQuery.trim() ? 'Suggestions' : 'Recent searches'}
                      </p>
                      {!searchQuery.trim() && recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={clearRecentSearches}
                          className="text-xs nav-link-active"
                          aria-label="Clear recent searches"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  )}

                  {searchDropdownItems.length > 0 && (
                    <ul id={suggestionListboxId} role="listbox" aria-label={searchQuery.trim() ? 'Search suggestions' : 'Recent searches'} className="py-2">
                      {searchDropdownItems.map((item, index) => (
                        <li key={item.id} role="presentation" className="group">
                          <div
                            id={`${suggestionListboxId}-option-${index}`}
                            role="option"
                            aria-selected={highlightedSuggestionIndex === index}
                            onMouseEnter={() => setHighlightedSuggestionIndex(index)}
                            className={`flex items-center justify-between gap-2 pl-4 pr-2 py-2 text-sm transition-colors ${
                              highlightedSuggestionIndex === index
                                ? 'bg-blue-50 dark:bg-slate-700 text-slate-900 dark:text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => applySearchValue(item.value)}
                              className="text-left flex-1 min-w-0"
                              aria-label={`Use ${item.label}`}
                            >
                              <span className="inline-flex items-center gap-2">
                                {item.kind === 'recent' && <Clock3 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />}
                                <span className="truncate">{item.label}</span>
                              </span>
                            </button>

                            {item.kind === 'recent' && (
                              <button
                                type="button"
                                onClick={() => removeRecentSearch(item.value)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-600/60"
                                aria-label={`Remove recent search ${item.value}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showNoResultsState && (
                    <div className="px-4 py-4" role="status" aria-live="polite">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">No results for “{searchQuery.trim()}”</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Try searching by photo title, tag, or photographer name.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {AVAILABLE_TAGS.slice(0, 3).map((tag) => (
                          <button
                            key={`hint-${tag}`}
                            type="button"
                            onClick={() => applySearchValue(tag)}
                            className="btn-secondary text-xs px-2.5 py-1.5"
                          >
                            Try “{tag}”
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-4">
              <div className="relative" ref={filterRef}>
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {selectedTags.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                      {selectedTags.length}
                    </span>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Filter Dropdown */}
                {isFilterOpen && (
                  <div className="absolute top-full left-0 mt-2 w-80 card-base border border-slate-300 dark:border-slate-600 shadow-lg z-10">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-slate-900 dark:text-white">Filter by Tags</h3>
                        {selectedTags.length > 0 && (
                          <button
                            onClick={clearAllTags}
                            className="nav-link-active text-sm"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                        {AVAILABLE_TAGS.map(tag => (
                          <label
                            key={tag}
                            className="flex items-center gap-2 p-2 rounded-lg hover-bg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedTags.includes(tag)}
                              onChange={() => toggleTag(tag)}
                              className="rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                              {tag}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                <button className="p-2 bg-blue-500 text-white">
                  <Grid className="h-4 w-4" />
                </button>
                <button className="p-2 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Active filters:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="status-badge status-active inline-flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </SectionContainer>

      <SectionContainer>
        <SectionTitle title="Gallery" />
        {/* Gallery Grid */}
        <GalleryGrid 
          limit={6}
          currentPage={currentPage}
          onLoadMore={handleLoadMore}
          isLoading={isLoading}
          selectedTags={selectedTags}
          searchQuery={searchQuery}
        />
      </SectionContainer>
    </div>
  );
}
