/**
 * Merchant Orders Hooks
 *
 * React Query hooks for managing merchant orders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { merchantApi } from '@/api/merchant.api';
import type {
  MerchantOrderFilters,
  UpdateOrderStatusDto,
  AddTrackingNumberDto,
} from '@/api/merchant.api';
import toast from 'react-hot-toast';

/**
 * Query keys for merchant orders
 */
export const merchantOrderKeys = {
  all: ['merchant', 'orders'] as const,
  lists: () => [...merchantOrderKeys.all, 'list'] as const,
  list: (filters: MerchantOrderFilters) =>
    [...merchantOrderKeys.lists(), filters] as const,
  details: () => [...merchantOrderKeys.all, 'detail'] as const,
  detail: (id: string) => [...merchantOrderKeys.details(), id] as const,
};

/**
 * Hook to fetch merchant orders with filters
 *
 * @param filters - Filters for orders
 * @returns Merchant orders with loading and error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useMerchantOrders({
 *   status: 'pending',
 *   page: 1,
 *   limit: 10
 * });
 * ```
 */
export const useMerchantOrders = (filters: MerchantOrderFilters = {}) => {
  return useQuery({
    queryKey: merchantOrderKeys.list(filters),
    queryFn: () => merchantApi.getMerchantOrders(filters),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get a single order by ID
 *
 * @param orderId - Order ID to fetch
 * @returns Order data with loading and error states
 *
 * @example
 * ```tsx
 * const { data: order, isLoading } = useMerchantOrder(orderId);
 * ```
 */
export const useMerchantOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: merchantOrderKeys.detail(orderId || ''),
    queryFn: () => merchantApi.getMerchantOrder(orderId!),
    enabled: !!orderId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to update order status
 *
 * @returns Mutation for updating order status
 *
 * @example
 * ```tsx
 * const updateStatus = useUpdateOrderStatus();
 * updateStatus.mutate({ orderId: '123', data: { status: 'preparing' } });
 * ```
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UpdateOrderStatusDto }) =>
      merchantApi.updateOrderStatus(orderId, data),
    onSuccess: (_, variables) => {
      // Invalidate all order lists to refetch
      queryClient.invalidateQueries({
        queryKey: merchantOrderKeys.lists(),
      });
      // Invalidate the specific order detail
      queryClient.invalidateQueries({
        queryKey: merchantOrderKeys.detail(variables.orderId),
      });
      toast.success('Order status updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update order status');
    },
  });
};

/**
 * Hook to add tracking number to order
 *
 * @returns Mutation for adding tracking number
 *
 * @example
 * ```tsx
 * const addTracking = useAddTrackingNumber();
 * addTracking.mutate({
 *   orderId: '123',
 *   data: { tracking_number: 'TRACK123', carrier: 'USPS' }
 * });
 * ```
 */
export const useAddTrackingNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: AddTrackingNumberDto }) =>
      merchantApi.addTrackingNumber(orderId, data),
    onSuccess: (_, variables) => {
      // Invalidate all order lists to refetch
      queryClient.invalidateQueries({
        queryKey: merchantOrderKeys.lists(),
      });
      // Invalidate the specific order detail
      queryClient.invalidateQueries({
        queryKey: merchantOrderKeys.detail(variables.orderId),
      });
      toast.success('Tracking number added successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to add tracking number');
    },
  });
};

/**
 * Hook to export orders to CSV
 *
 * @returns Mutation for exporting orders
 *
 * @example
 * ```tsx
 * const exportCSV = useExportOrdersCSV();
 * exportCSV.mutate({ status: 'completed', date_from: '2024-01-01' });
 * ```
 */
export const useExportOrdersCSV = () => {
  return useMutation({
    mutationFn: (filters: MerchantOrderFilters) =>
      merchantApi.exportOrdersToCSV(filters),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Orders exported successfully!');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to export orders');
    },
  });
};
