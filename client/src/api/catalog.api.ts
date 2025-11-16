/**
 * Catalog API Client
 *
 * API client for the catalog module with React Query hooks
 * Provides methods for fetching products, categories, and search
 */

import { apiClient } from './axios.config';
import type {
  Product,
  ProductDetail,
  Category,
  ProductFilters,
  PaginatedProducts,
} from '@/types/catalog';

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get paginated list of products with filters
 */
export const getProducts = async (
  filters: ProductFilters = {}
): Promise<PaginatedProducts> => {
  // Convert page to offset for backend
  const { page, ...restFilters } = filters;
  const currentPage = page || 1;
  const limit = filters.limit || 20;
  const params = {
    ...restFilters,
    offset: (currentPage - 1) * limit,
  };

  const response = await apiClient.get<{
    products: Product[];
    total: number;
    limit: number;
    offset: number;
  }>('/products', {
    params,
  });

  // Transform backend response to frontend format
  const { products, total, offset } = response.data;
  const pages = Math.ceil(total / limit);

  return {
    data: products,
    pagination: {
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      pages,
      offset,
    },
  };
};

/**
 * Get single product by ID with all relations (variants, translations)
 */
export const getProduct = async (id: string): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail>(`/products/${id}`);
  return response.data;
};

/**
 * Get list of categories
 * Note: Categories are derived from product attributes, not a separate entity
 * TODO: Backend endpoint not implemented yet, returning empty array
 */
export const getCategories = async (): Promise<Category[]> => {
  // const response = await apiClient.get<Category[]>('/catalog/categories');
  // return response.data;
  return [];
};

/**
 * Search products by query with optional filters
 */
export const searchProducts = async (
  query: string,
  filters: ProductFilters = {}
): Promise<PaginatedProducts> => {
  const response = await apiClient.get<PaginatedProducts>('/catalog/products', {
    params: {
      q: query,
      search: query,
      ...filters,
    },
  });
  return response.data;
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail>(`/catalog/products/slug/${slug}`);
  return response.data;
};

/**
 * Get featured products (most popular or recently viewed)
 */
export const getFeaturedProducts = async (
  limit: number = 10
): Promise<Product[]> => {
  const response = await apiClient.get<PaginatedProducts>('/catalog/products', {
    params: {
      sort_by: 'popular',
      limit,
    },
  });
  return response.data.data;
};

/**
 * Get related products based on product ID
 */
export const getRelatedProducts = async (
  productId: string,
  limit: number = 5
): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>(
    `/catalog/products/${productId}/related`,
    {
      params: { limit },
    }
  );
  return response.data;
};

/**
 * Get autocomplete search suggestions
 */
export interface AutocompleteItem {
  id: string;
  title: string;
  image_url?: string;
  price: number;
  currency: string;
  type: string;
}

export interface AutocompleteResponse {
  products: AutocompleteItem[];
  services: AutocompleteItem[];
  categories: string[];
}

export const getAutocomplete = async (
  query: string,
  locale: string = 'en'
): Promise<AutocompleteResponse> => {
  const response = await apiClient.get<AutocompleteResponse>('/products/autocomplete', {
    params: { q: query, locale },
  });
  return response.data;
};

// ============================================================================
// Export all methods
// ============================================================================

export const catalogApi = {
  getProducts,
  getProduct,
  getCategories,
  searchProducts,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
  getAutocomplete,
};

export default catalogApi;
