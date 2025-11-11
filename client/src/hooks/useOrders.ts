/**
 * React Query Hooks for Orders Module
 *
 * Custom hooks for fetching and mutating order data:
 * - Orders list with filters
 * - Single order details
 * - Cancel order
 * - Request refund
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import {
  getOrders,
  getOrder,
  cancelOrder,
  requestRefund,
} from '@/api/order.api';
import type {
  Order,
  OrderFilters,
  PaginatedOrders,
  CancelOrderDto,
  RequestRefundDto,
} from '@/types';

// ============================================================================
// Query Keys Factory
// ============================================================================

/**
 * Centralized query keys for order queries
 * Helps with cache invalidation and query identification
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
};

// ============================================================================
// React Query Hooks - Queries
// ============================================================================

/**
 * Hook to fetch paginated orders with filters
 *
 * @param filters - Order filters (status, payment status, date range, etc.)
 * @param options - React Query options
 * @returns Query result with orders data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useOrders({
 *   status: OrderStatus.COMPLETED,
 *   date_from: '2024-01-01',
 *   limit: 20,
 *   page: 1,
 * });
 *
 * if (data) {
 *   console.log(`Found ${data.pagination.total} orders`);
 *   data.data.forEach(order => console.log(order.order_number));
 * }
 * ```
 */
export const useOrders = (
  filters: OrderFilters = {},
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
): UseQueryResult<PaginatedOrders, Error> => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters),
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to fetch single order by ID with line items populated
 *
 * @param orderId - Order UUID
 * @param options - React Query options
 * @returns Query result with order details
 *
 * @example
 * ```tsx
 * const { data: order, isLoading } = useOrder('order-uuid');
 *
 * if (order) {
 *   console.log(order.order_number);
 *   console.log(`Total: ${order.total_amount / 100} ${order.currency}`);
 *   order.line_items.forEach(item => {
 *     console.log(`${item.product_name} x ${item.quantity}`);
 *   });
 * }
 * ```
 */
export const useOrder = (
  orderId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchInterval?: number;
  },
): UseQueryResult<Order, Error> => {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: () => getOrder(orderId),
    staleTime: options?.staleTime ?? 1 * 60 * 1000, // 1 minute
    refetchInterval: options?.refetchInterval, // Optional auto-refresh for tracking
    enabled: options?.enabled !== false && !!orderId,
  });
};

// ============================================================================
// React Query Hooks - Mutations
// ============================================================================

/**
 * Hook to cancel an order
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```tsx
 * const cancelOrderMutation = useCancelOrder({
 *   onSuccess: (updatedOrder) => {
 *     console.log(`Order ${updatedOrder.order_number} cancelled`);
 *     toast.success('Order cancelled successfully');
 *   },
 *   onError: (error) => {
 *     toast.error(`Failed to cancel order: ${error.message}`);
 *   },
 * });
 *
 * // Later, in a button click handler:
 * cancelOrderMutation.mutate({
 *   orderId: 'order-uuid',
 *   data: { reason: 'Changed my mind' },
 * });
 * ```
 */
export const useCancelOrder = (
  options?: {
    onSuccess?: (data: Order) => void;
    onError?: (error: Error) => void;
  },
): UseMutationResult<
  Order,
  Error,
  { orderId: string; data?: CancelOrderDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }) => cancelOrder(orderId, data),
    onSuccess: (data) => {
      // Invalidate and refetch order queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });

      // Call custom onSuccess callback
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

/**
 * Hook to request refund for order or line item
 *
 * @param options - Mutation options
 * @returns Mutation result
 *
 * @example
 * ```tsx
 * const refundMutation = useRequestRefund({
 *   onSuccess: (updatedOrder) => {
 *     console.log(`Refund requested for order ${updatedOrder.order_number}`);
 *     toast.success('Refund request submitted');
 *   },
 * });
 *
 * // Request full order refund:
 * refundMutation.mutate({
 *   orderId: 'order-uuid',
 *   data: { reason: 'Product defective' },
 * });
 *
 * // Request partial refund for specific line item:
 * refundMutation.mutate({
 *   orderId: 'order-uuid',
 *   data: {
 *     line_item_id: 'line-item-uuid',
 *     reason: 'Item damaged',
 *     amount: 5000, // $50.00 in cents
 *   },
 * });
 * ```
 */
export const useRequestRefund = (
  options?: {
    onSuccess?: (data: Order) => void;
    onError?: (error: Error) => void;
  },
): UseMutationResult<
  Order,
  Error,
  { orderId: string; data: RequestRefundDto }
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }) => requestRefund(orderId, data),
    onSuccess: (data) => {
      // Invalidate and refetch order queries
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(data.id) });

      // Call custom onSuccess callback
      options?.onSuccess?.(data);
    },
    onError: options?.onError,
  });
};

// ============================================================================
// Export all hooks
// ============================================================================

export default {
  useOrders,
  useOrder,
  useCancelOrder,
  useRequestRefund,
};
