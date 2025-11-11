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
  const response = await apiClient.get<PaginatedProducts>('/catalog/products', {
    params: filters,
  });
  return response.data;
};

/**
 * Get single product by ID with all relations (variants, translations)
 */
export const getProduct = async (id: string): Promise<ProductDetail> => {
  const response = await apiClient.get<ProductDetail>(`/catalog/products/${id}`);
  return response.data;
};

/**
 * Get list of categories
 * Note: Categories are derived from product attributes, not a separate entity
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<Category[]>('/catalog/categories');
  return response.data;
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
};

export default catalogApi;
