/**
 * Merchant API Client
 *
 * API client for merchant-specific operations
 */

import { apiClient } from './axios.config';
import type { Product, ProductType, ProductStatus, PaginatedProducts } from '@/types/catalog';

// ============================================================================
// Types
// ============================================================================

export interface MerchantProductFilters {
  type?: ProductType;
  status?: ProductStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MerchantProductsResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    offset: number;
  };
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get merchant's products with filters
 */
export const getMerchantProducts = async (
  filters: MerchantProductFilters = {}
): Promise<MerchantProductsResponse> => {
  const response = await apiClient.get<MerchantProductsResponse>('/merchant/products', {
    params: filters,
  });
  return response.data;
};

/**
 * Delete a product (soft delete)
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  await apiClient.delete(`/merchant/products/${productId}`);
};

/**
 * Toggle product status between active and inactive
 */
export const toggleProductStatus = async (productId: string): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/merchant/products/${productId}/toggle-status`);
  return response.data;
};

// ============================================================================
// Export all methods
// ============================================================================

export const merchantApi = {
  getMerchantProducts,
  deleteProduct,
  toggleProductStatus,
};

export default merchantApi;
