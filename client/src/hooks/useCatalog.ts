/**
 * React Query Hooks for Catalog Module
 *
 * Custom hooks for fetching and caching catalog data:
 * - Products list with filters
 * - Single product details
 * - Categories
 * - Product search
 * - Featured and related products
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  getProducts,
  getProduct,
  getCategories,
  searchProducts,
  getProductBySlug,
  getFeaturedProducts,
  getRelatedProducts,
} from '@/api/catalog.api';
import type {
  Product,
  ProductDetail,
  Category,
  ProductFilters,
  PaginatedProducts,
} from '@/types/catalog';

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query keys for catalog queries
 * Helps with cache invalidation and query identification
 */
export const catalogKeys = {
  all: ['catalog'] as const,
  products: () => [...catalogKeys.all, 'products'] as const,
  productsList: (filters: ProductFilters) =>
    [...catalogKeys.products(), 'list', filters] as const,
  product: (id: string) => [...catalogKeys.products(), 'detail', id] as const,
  productBySlug: (slug: string) =>
    [...catalogKeys.products(), 'slug', slug] as const,
  featuredProducts: (limit: number) =>
    [...catalogKeys.products(), 'featured', limit] as const,
  relatedProducts: (productId: string, limit: number) =>
    [...catalogKeys.products(), 'related', productId, limit] as const,
  categories: () => [...catalogKeys.all, 'categories'] as const,
  search: (query: string, filters: ProductFilters) =>
    [...catalogKeys.products(), 'search', query, filters] as const,
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook to fetch paginated products with filters
 *
 * @param filters - Product filters (type, price range, category, etc.)
 * @param options - React Query options
 * @returns Query result with products data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useProducts({
 *   type: ProductType.PHYSICAL,
 *   min_price: 1000,
 *   max_price: 50000,
 *   limit: 20,
 *   page: 1,
 * });
 * ```
 */
export const useProducts = (
  filters: ProductFilters = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<PaginatedProducts, Error> => {
  return useQuery({
    queryKey: catalogKeys.productsList(filters),
    queryFn: () => getProducts(filters),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to fetch single product by ID
 *
 * @param id - Product ID
 * @param options - React Query options
 * @returns Query result with product details
 *
 * @example
 * ```tsx
 * const { data: product, isLoading } = useProduct('product-uuid');
 *
 * if (product) {
 *   console.log(product.title, product.variants);
 * }
 * ```
 */
export const useProduct = (
  id: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<ProductDetail, Error> => {
  return useQuery({
    queryKey: catalogKeys.product(id),
    queryFn: () => getProduct(id),
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false && !!id,
  });
};

/**
 * Hook to fetch product by slug
 *
 * @param slug - Product slug
 * @param options - React Query options
 * @returns Query result with product details
 *
 * @example
 * ```tsx
 * const { data: product } = useProductBySlug('iphone-15-pro');
 * ```
 */
export const useProductBySlug = (
  slug: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<ProductDetail, Error> => {
  return useQuery({
    queryKey: catalogKeys.productBySlug(slug),
    queryFn: () => getProductBySlug(slug),
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false && !!slug,
  });
};

/**
 * Hook to fetch categories
 *
 * @param options - React Query options
 * @returns Query result with categories list
 *
 * @example
 * ```tsx
 * const { data: categories } = useCategories();
 *
 * categories?.map(cat => (
 *   <div key={cat.id}>{cat.name}</div>
 * ))
 * ```
 */
export const useCategories = (
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<Category[], Error> => {
  return useQuery({
    queryKey: catalogKeys.categories(),
    queryFn: getCategories,
    staleTime: options?.staleTime ?? 30 * 60 * 1000, // 30 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to search products by query
 *
 * @param query - Search query string
 * @param filters - Additional filters to apply
 * @param options - React Query options
 * @returns Query result with search results
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const { data, isLoading } = useSearchProducts(searchQuery, {
 *   type: ProductType.PHYSICAL,
 * }, {
 *   enabled: searchQuery.length > 2, // Only search when query is long enough
 * });
 * ```
 */
export const useSearchProducts = (
  query: string,
  filters: ProductFilters = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<PaginatedProducts, Error> => {
  return useQuery({
    queryKey: catalogKeys.search(query, filters),
    queryFn: () => searchProducts(query, filters),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled !== false && query.length > 0,
  });
};

/**
 * Hook to fetch featured products
 *
 * @param limit - Number of products to fetch
 * @param options - React Query options
 * @returns Query result with featured products
 *
 * @example
 * ```tsx
 * const { data: featured } = useFeaturedProducts(10);
 * ```
 */
export const useFeaturedProducts = (
  limit: number = 10,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<Product[], Error> => {
  return useQuery({
    queryKey: catalogKeys.featuredProducts(limit),
    queryFn: () => getFeaturedProducts(limit),
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to fetch related products
 *
 * @param productId - Product ID to get related products for
 * @param limit - Number of related products to fetch
 * @param options - React Query options
 * @returns Query result with related products
 *
 * @example
 * ```tsx
 * const { data: related } = useRelatedProducts('product-uuid', 5);
 * ```
 */
export const useRelatedProducts = (
  productId: string,
  limit: number = 5,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  }
): UseQueryResult<Product[], Error> => {
  return useQuery({
    queryKey: catalogKeys.relatedProducts(productId, limit),
    queryFn: () => getRelatedProducts(productId, limit),
    staleTime: options?.staleTime ?? 10 * 60 * 1000, // 10 minutes
    enabled: options?.enabled !== false && !!productId,
  });
};

// ============================================================================
// Export all hooks
// ============================================================================

export default {
  useProducts,
  useProduct,
  useProductBySlug,
  useCategories,
  useSearchProducts,
  useFeaturedProducts,
  useRelatedProducts,
};
