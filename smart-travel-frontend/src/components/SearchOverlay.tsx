'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Globe } from 'lucide-react';
import { geocodingService, GeocodingResult } from '@/services/geocoding';
import type { Destination } from '@/types';

interface SearchOverlayProps {
  destinations: Destination[];
  onSelectDestination: (destination: Destination) => void;
  onSelectLocation: (lat: number, lng: number, name: string) => void;
  // filtersActive removed as it was unused
}

// Simple fuzzy score (Levenshtein distance approximation)
function fuzzyScore(query: string, target: string): number {
  if (query === target) return 100;
  if (target.includes(query)) return 60;
  
  // Simple character matching
  let matches = 0;
  for (const char of query) {
    if (target.includes(char)) matches++;
  }
  return (matches / query.length) * 40;
}

// Hybrid search with popularity weighting
function calculateScore(query: string, dest: Destination): number {
  const q = query.toLowerCase();
  const name = (dest.name || '').toLowerCase();
  const district = (dest.district || '').toLowerCase();

  let baseScore = 0;

  // Exact match
  if (name === q) baseScore = 100;
  // Starts with
  else if (name.startsWith(q)) baseScore = 80;
  // District match
  else if (district.includes(q)) baseScore = 60;
  // Contains
  else if (name.includes(q)) baseScore = 40;
  // Fuzzy similarity (normalized by query length)
  else {
    const fuzzy = fuzzyScore(q, name);
    baseScore = fuzzy * (q.length / name.length);
  }

  // Popularity weight
  const popularityBonus = (dest.popularity_score || 0) * 0.1;

  // Cap at 100 for predictable marker sizing
  return Math.min(baseScore + popularityBonus, 100);
}

export default function SearchOverlay({
    destinations,
    onSelectDestination,
    onSelectLocation,
  }: SearchOverlayProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [globalResults, setGlobalResults] = useState<GeocodingResult[]>([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
    const [hasSearchedGlobal, setHasSearchedGlobal] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
    // Debounced search results for local destinations
    const localResults = useMemo(() => {
      if (!query.trim()) return [];
  
      const results = destinations
        .map((dest) => ({
          destination: dest,
          score: calculateScore(query, dest),
          outsideFilters: false, // Can be determined based on active filters
        }))
        .filter((result) => result.score > 20) // Only show relevant matches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Limit local results to 5
  
      return results;
    }, [query, destinations]);
  
    // Combined results for navigation
    const allResults = useMemo(() => {
      return [
        ...localResults.map(r => ({ type: 'local' as const, data: r })),
        ...globalResults.map(r => ({ type: 'global' as const, data: r }))
      ];
    }, [localResults, globalResults]);
  
    // Handle input change with debounce for global search
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setQuery(val);
      setIsOpen(true);
      setSelectedIndex(0);
  
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
  
      if (val.length >= 3) {
        setIsSearchingGlobal(true);
        setHasSearchedGlobal(false);
        debounceTimerRef.current = setTimeout(async () => {
          try {
            const results = await geocodingService.searchPlaces(val);
            setGlobalResults(results);
          } catch (error) {
            console.error('Failed to search locations:', error);
          } finally {
            setIsSearchingGlobal(false);
            setHasSearchedGlobal(true);
          }
        }, 500); // 500ms debounce
      } else {
        setGlobalResults([]);
        setIsSearchingGlobal(false);
        setHasSearchedGlobal(false);
      }
    };
  
    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen || allResults.length === 0) return;
  
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % allResults.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (allResults[selectedIndex]) {
            const item = allResults[selectedIndex];
            if (item.type === 'local') {
              handleSelectDestination(item.data.destination);
            } else {
              handleSelectGlobalLocation(item.data);
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setQuery('');
          break;
      }
    };
  
    const handleSelectDestination = (destination: Destination) => {
      onSelectDestination(destination);
      setQuery('');
      setIsOpen(false);
      setGlobalResults([]);
    };
  
    const handleSelectGlobalLocation = (location: GeocodingResult) => {
      onSelectLocation(parseFloat(location.lat), parseFloat(location.lon), location.display_name.split(',')[0]);
      setQuery('');
      setIsOpen(false);
      setGlobalResults([]);
    };
  
    // Auto-scroll selected item into view
    useEffect(() => {
      if (resultsRef.current && isOpen) {
        const resultItems = resultsRef.current.querySelectorAll('[role="option"]');
        const selected = resultItems[selectedIndex] as HTMLElement;
        if (selected) {
          selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    }, [selectedIndex, isOpen]);
  
    return (
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-md">
        <div className="relative">
          {/* Search Input */}
          <div className="relative shadow-lg rounded-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              ref={inputRef}
              type="search"
              placeholder="Search destinations..."
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-12 py-3 rounded-xl border-2 border-gray-100 focus:border-indigo-500 focus:outline-none transition bg-white text-gray-900 placeholder:text-gray-400"
              aria-label="Search destinations"
              aria-autocomplete="list"
              aria-controls="search-results"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setIsOpen(false);
                  setGlobalResults([]);
                  setHasSearchedGlobal(false);
                  inputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
  
          {/* Search Results Dropdown */}
          {isOpen && query && (localResults.length > 0 || globalResults.length > 0 || isSearchingGlobal || (query.length >= 3 && hasSearchedGlobal)) && (
            <div
              id="search-results"
              ref={resultsRef}
              className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50"
              role="listbox"
            >
              {/* Local Results Section */}
              {localResults.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    My Destinations
                  </div>
                  {localResults.map((result, index) => (
                    <div
                      key={`local-${result.destination.id}`}
                      role="option"
                      aria-selected={index === selectedIndex}
                      tabIndex={0}
                      onClick={() => handleSelectDestination(result.destination)}
                      className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                        index === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{result.destination.name}</div>
                          <div className="text-sm text-gray-500">{result.destination.district}</div>
                        </div>
                        {result.destination.match_score !== undefined && (
                          <div className="ml-3 flex-shrink-0">
                            <div
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                result.destination.match_score >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : result.destination.match_score >= 60
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result.destination.match_score}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
  
              {/* Global Results Section */}
              {(globalResults.length > 0 || isSearchingGlobal || (query.length >= 3 && hasSearchedGlobal)) && (
                <div className="py-2 border-t border-gray-100">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      OpenStreetMap
                    </span>
                    {isSearchingGlobal && <span className="animate-pulse text-indigo-500">Searching...</span>}
                  </div>
                  {globalResults.map((result, index) => {
                    // Adjust index for correct highlighting across sections
                    const globalIndex = index + localResults.length;
                    return (
                      <div
                        key={`global-${result.place_id}`}
                        role="option"
                        aria-selected={globalIndex === selectedIndex}
                        tabIndex={0}
                        onClick={() => handleSelectGlobalLocation(result)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                          globalIndex === selectedIndex ? 'bg-indigo-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Globe className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">
                                {result.display_name.split(',')[0]}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-2">
                                {result.display_name}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!isSearchingGlobal && hasSearchedGlobal && globalResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      No results found on OpenStreetMap
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
  
          {/* No Results */}
          {isOpen && query && !isSearchingGlobal && localResults.length === 0 && globalResults.length === 0 && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-200 px-4 py-8 text-center">
              <p className="text-gray-500">No destinations found for &quot;{query}&quot;</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>
    );
  }
