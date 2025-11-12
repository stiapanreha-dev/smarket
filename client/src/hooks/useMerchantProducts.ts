/**
 * Merchant Products Hooks
 *
 * React Query hooks for managing merchant products
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantApi } from '@/api/merchant.api';
import type { MerchantProductFilters, CreateProductDto } from '@/api/merchant.api';
import toast from 'react-hot-toast';

/**
 * Query keys for merchant products
 */
export const merchantProductKeys = {
  all: ['merchant', 'products'] as const,
  lists: () => [...merchantProductKeys.all, 'list'] as const,
  list: (filters: MerchantProductFilters) =>
    [...merchantProductKeys.lists(), filters] as const,
  details: () => [...merchantProductKeys.all, 'detail'] as const,
  detail: (id: string) => [...merchantProductKeys.details(), id] as const,
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

/**
 * Hook to get a single product by ID
 *
 * @param productId - Product ID to fetch
 * @returns Product data with loading and error states
 *
 * @example
 * ```tsx
 * const { data: product, isLoading } = useProduct(productId);
 * ```
 */
export const useProduct = (productId: string | undefined) => {
  return useQuery({
    queryKey: merchantProductKeys.detail(productId || ''),
    queryFn: () => merchantApi.getMerchantProduct(productId!),
    enabled: !!productId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new product
 *
 * @returns Mutation for creating a product
 *
 * @example
 * ```tsx
 * const createProduct = useCreateProduct();
 * createProduct.mutate(productData);
 * ```
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => merchantApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: merchantProductKeys.lists(),
      });
      toast.success('Product created successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create product');
    },
  });
};

/**
 * Hook to update an existing product
 *
 * @returns Mutation for updating a product
 *
 * @example
 * ```tsx
 * const updateProduct = useUpdateProduct();
 * updateProduct.mutate({ id: productId, data: updatedData });
 * ```
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateProductDto> }) =>
      merchantApi.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: merchantProductKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: merchantProductKeys.detail(variables.id),
      });
      toast.success('Product updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update product');
    },
  });
};

/**
 * Hook to upload product image
 *
 * @returns Mutation for uploading an image
 *
 * @example
 * ```tsx
 * const uploadImage = useUploadProductImage();
 * uploadImage.mutate(file);
 * ```
 */
export const useUploadProductImage = () => {
  return useMutation({
    mutationFn: (file: File) => merchantApi.uploadProductImage(file),
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload image');
    },
  });
};
