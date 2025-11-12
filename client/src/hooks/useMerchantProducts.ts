/**
 * Merchant Products Hooks
 *
 * React Query hooks for managing merchant products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantApi } from '@/api/merchant.api';
import type { MerchantProductFilters } from '@/api/merchant.api';

/**
 * Query keys for merchant products
 */
export const merchantProductKeys = {
  all: ['merchant', 'products'] as const,
  lists: () => [...merchantProductKeys.all, 'list'] as const,
  list: (filters: MerchantProductFilters) =>
    [...merchantProductKeys.lists(), filters] as const,
};

/**
 * Hook to fetch merchant products with filters
 *
 * @param filters - Filters for products
 * @returns Merchant products with loading and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMerchantProducts({
 *   status: 'active',
 *   page: 1,
 *   limit: 10
 * });
 * ```
 */
export const useMerchantProducts = (filters: MerchantProductFilters = {}) => {
  return useQuery({
    queryKey: merchantProductKeys.list(filters),
    queryFn: () => merchantApi.getMerchantProducts(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to delete a product
 *
 * @returns Mutation for deleting a product
 *
 * @example
 * ```tsx
 * const deleteProduct = useDeleteProduct();
 * deleteProduct.mutate(productId);
 * ```
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => merchantApi.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate all product lists to refetch
      queryClient.invalidateQueries({
        queryKey: merchantProductKeys.lists(),
      });
    },
  });
};

/**
 * Hook to toggle product status
 *
 * @returns Mutation for toggling product status
 *
 * @example
 * ```tsx
 * const toggleStatus = useToggleProductStatus();
 * toggleStatus.mutate(productId);
 * ```
 */
export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) => merchantApi.toggleProductStatus(productId),
    onSuccess: () => {
      // Invalidate all product lists to refetch
      queryClient.invalidateQueries({
        queryKey: merchantProductKeys.lists(),
      });
    },
  });
};
