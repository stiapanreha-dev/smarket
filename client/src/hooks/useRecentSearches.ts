import { useState, useEffect } from 'react';

const RECENT_SEARCHES_KEY = 'snailmarket_recent_searches';
const MAX_RECENT_SEARCHES = 5;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
        setRecentSearches([]);
      }
    }
  }, []);

  // Add a search query to recent searches
  const addRecentSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setRecentSearches((prev) => {
      // Remove duplicates and add to front
      const filtered = prev.filter((q) => q !== trimmedQuery);
      const updated = [trimmedQuery, ...filtered].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));

      return updated;
    });
  };

  // Clear all recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Remove a specific search
  const removeRecentSearch = (query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((q) => q !== query);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
      return filtered;
    });
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
};
