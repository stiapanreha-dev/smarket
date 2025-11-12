/**
 * React Query Hooks for Search Module
 *
 * Custom hooks for comprehensive search functionality:
 * - Grouped search results
 * - Search suggestions
 * - Popular searches
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  search,
  getSuggestions,
  getPopularSearches,
  type GroupedSearchResults,
  type SearchParams,
  type SearchSuggestion,
} from '@/api/search.api';

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query keys for search queries
 */
export const searchKeys = {
  all: ['search'] as const,
  results: (params: SearchParams) => [...searchKeys.all, 'results', params] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  popular: () => [...searchKeys.all, 'popular'] as const,
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to search across products, services, and categories with grouped results
 *
 * @param params - Search parameters including query, type filter, and pagination
 * @param options - React Query options
 * @returns Query result with grouped search results
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useSearch({
 *   q: 'laptop',
 *   type: 'all',
 *   page: 1,
 *   limit: 12,
 * });
 *
 * if (data) {
 *   console.log('Products:', data.products.data);
 *   console.log('Services:', data.services.data);
 *   console.log('Categories:', data.categories);
 * }
 * ```
 */
export const useSearch = (
  params: SearchParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<GroupedSearchResults, Error> => {
  return useQuery({
    queryKey: searchKeys.results(params),
    queryFn: () => search(params),
    staleTime: options?.staleTime ?? 3 * 60 * 1000, // 3 minutes
    enabled: options?.enabled !== false && params.q.length > 0,
  });
};

/**
 * Hook to get search suggestions (typo corrections and autocomplete)
 *
 * @param query - Search query string
 * @param options - React Query options
 * @returns Query result with search suggestions
 *
 * @example
 * ```tsx
 * const { data: suggestions } = useSearchSuggestions('lapto', {
 *   enabled: query.length >= 3,
 * });
 *
 * if (suggestions) {
 *   suggestions.map(s => (
 *     <div key={s.query}>
 *       Did you mean: {s.query}? ({s.count} results)
 *     </div>
 *   ))
 * }
 * ```
 */
export const useSearchSuggestions = (
  query: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<SearchSuggestion[], Error> => {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: () => getSuggestions(query),
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false && query.length >= 3,
  });
};

/**
 * Hook to get popular searches
 *
 * @param options - React Query options
 * @returns Query result with popular search queries
 *
 * @example
 * ```tsx
 * const { data: popular } = usePopularSearches();
 *
 * popular?.map(query => (
 *   <button onClick={() => navigate(`/search?q=${query}`)}>
 *     {query}
 *   </button>
 * ))
 * ```
 */
export const usePopularSearches = (
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<string[], Error> => {
  return useQuery({
    queryKey: searchKeys.popular(),
    queryFn: getPopularSearches,
    staleTime: options?.staleTime ?? 30 * 60 * 1000, // 30 minutes
    enabled: options?.enabled,
  });
};

// ============================================================================
// Export all hooks
// ============================================================================

export default {
  useSearch,
  useSearchSuggestions,
  usePopularSearches,
};
