/**
 * Search API Client
 *
 * API client for comprehensive search across products, services, and categories
 */

import { apiClient } from './axios.config';
import type {
  Product,
  ProductFilters,
  PaginatedProducts,
  Category,
} from '@/types/catalog';

// ============================================================================
// Types
// ============================================================================

/**
 * Search result type filter
 */
export type SearchType = 'all' | 'products' | 'services';

/**
 * Grouped search results by product type
 */
export interface GroupedSearchResults {
  products: PaginatedProducts; // PHYSICAL products
  services: PaginatedProducts; // SERVICE and COURSE products
  categories: Category[];
  suggestions?: string[]; // "Did you mean?" suggestions
  total_count: number; // Total across all groups
}

/**
 * Search filters extending ProductFilters
 */
export interface SearchFilters extends Omit<ProductFilters, 'type'> {
  type?: SearchType; // 'all' | 'products' | 'services'
  categories?: string[]; // Multiple categories
}

/**
 * Search parameters for API request
 */
export interface SearchParams extends SearchFilters {
  q: string; // Search query (required)
  page?: number;
  limit?: number;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Comprehensive search across all types with grouped results
 */
export const search = async (
  params: SearchParams
): Promise<GroupedSearchResults> => {
  const { q, type = 'all', page = 1, limit = 12, ...filters } = params;

  // When type is 'all', we need to fetch all groups
  if (type === 'all') {
    // Fetch products, services, and categories in parallel
    const [productsRes, servicesRes, categoriesRes] = await Promise.all([
      // Fetch PHYSICAL products
      apiClient.get<PaginatedProducts>('/catalog/products', {
        params: {
          q,
          type: 'PHYSICAL',
          page,
          limit,
          ...filters,
        },
      }),
      // Fetch SERVICE and COURSE products
      apiClient.get<PaginatedProducts>('/catalog/products', {
        params: {
          q,
          type: 'SERVICE,COURSE',
          page,
          limit,
          ...filters,
        },
      }),
      // Fetch matching categories
      apiClient.get<Category[]>('/catalog/categories', {
        params: { q },
      }),
    ]);

    const products = productsRes.data;
    const services = servicesRes.data;
    const categories = categoriesRes.data;

    return {
      products,
      services,
      categories,
      total_count:
        products.pagination.total +
        services.pagination.total +
        categories.length,
    };
  }

  // Type-specific search
  if (type === 'products') {
    const response = await apiClient.get<PaginatedProducts>('/catalog/products', {
      params: {
        q,
        type: 'PHYSICAL',
        page,
        limit,
        ...filters,
      },
    });

    return {
      products: response.data,
      services: {
        data: [],
        pagination: { total: 0, page: 1, limit, pages: 0 },
      },
      categories: [],
      total_count: response.data.pagination.total,
    };
  }

  if (type === 'services') {
    const response = await apiClient.get<PaginatedProducts>('/catalog/products', {
      params: {
        q,
        type: 'SERVICE,COURSE',
        page,
        limit,
        ...filters,
      },
    });

    return {
      products: {
        data: [],
        pagination: { total: 0, page: 1, limit, pages: 0 },
      },
      services: response.data,
      categories: [],
      total_count: response.data.pagination.total,
    };
  }

  // Fallback (shouldn't reach here)
  return {
    products: {
      data: [],
      pagination: { total: 0, page: 1, limit, pages: 0 },
    },
    services: {
      data: [],
      pagination: { total: 0, page: 1, limit, pages: 0 },
    },
    categories: [],
    total_count: 0,
  };
};

/**
 * Get search suggestions (typo correction, autocomplete)
 */
export interface SearchSuggestion {
  query: string;
  type: 'correction' | 'autocomplete';
  count?: number; // Number of results for this suggestion
}

export const getSuggestions = async (
  query: string
): Promise<SearchSuggestion[]> => {
  try {
    const response = await apiClient.get<SearchSuggestion[]>(
      '/catalog/search/suggestions',
      {
        params: { q: query },
      }
    );
    return response.data;
  } catch (error) {
    // If endpoint doesn't exist yet, return empty array
    console.warn('Search suggestions endpoint not available:', error);
    return [];
  }
};

/**
 * Get popular searches
 */
export const getPopularSearches = async (): Promise<string[]> => {
  try {
    const response = await apiClient.get<string[]>('/catalog/search/popular');
    return response.data;
  } catch (error) {
    console.warn('Popular searches endpoint not available:', error);
    return [];
  }
};

// ============================================================================
// Export all methods
// ============================================================================

export const searchApi = {
  search,
  getSuggestions,
  getPopularSearches,
};

export default searchApi;
