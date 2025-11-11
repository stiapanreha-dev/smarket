/**
 * Order API Client
 *
 * Handles all order-related API requests:
 * - Get orders list with filters
 * - Get single order details
 * - Cancel order
 * - Request refund
 */

import { apiClient } from './axios.config';
import type {
  Order,
  OrderFilters,
  PaginatedOrders,
  CancelOrderDto,
  RequestRefundDto,
} from '@/types';

/**
 * Order API endpoints
 */
const ORDER_ENDPOINTS = {
  ORDERS: '/orders',
  ORDER: (orderId: string) => `/orders/${orderId}`,
  CANCEL: (orderId: string) => `/orders/${orderId}/cancel`,
  REFUND: (orderId: string) => `/orders/${orderId}/refund`,
} as const;

/**
 * Order API client
 */
export const orderApi = {
  /**
   * Get orders list with optional filters
   *
   * @param filters - Order filters (status, payment status, date range, etc.)
   * @returns Paginated list of orders
   */
  async getOrders(filters?: OrderFilters): Promise<PaginatedOrders> {
    const response = await apiClient.get<PaginatedOrders>(
      ORDER_ENDPOINTS.ORDERS,
      { params: filters },
    );
    return response.data;
  },

  /**
   * Get single order by ID with line items populated
   *
   * @param orderId - Order UUID
   * @returns Order with line items and full details
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(
      ORDER_ENDPOINTS.ORDER(orderId),
    );
    return response.data;
  },

  /**
   * Cancel an order
   *
   * @param orderId - Order UUID
   * @param data - Optional cancellation reason
   * @returns Updated order
   */
  async cancelOrder(orderId: string, data?: CancelOrderDto): Promise<Order> {
    const response = await apiClient.post<Order>(
      ORDER_ENDPOINTS.CANCEL(orderId),
      data || {},
    );
    return response.data;
  },

  /**
   * Request refund for order or specific line item
   *
   * @param orderId - Order UUID
   * @param data - Refund details (reason, line item, amount)
   * @returns Updated order
   */
  async requestRefund(
    orderId: string,
    data: RequestRefundDto,
  ): Promise<Order> {
    const response = await apiClient.post<Order>(
      ORDER_ENDPOINTS.REFUND(orderId),
      data,
    );
    return response.data;
  },
};

// ============================================================================
// Individual API Functions (for use with React Query)
// ============================================================================

/**
 * Fetch orders list with filters
 */
export async function getOrders(filters?: OrderFilters): Promise<PaginatedOrders> {
  return orderApi.getOrders(filters);
}

/**
 * Fetch single order by ID
 */
export async function getOrder(orderId: string): Promise<Order> {
  return orderApi.getOrder(orderId);
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  orderId: string,
  data?: CancelOrderDto,
): Promise<Order> {
  return orderApi.cancelOrder(orderId, data);
}

/**
 * Request refund for order
 */
export async function requestRefund(
  orderId: string,
  data: RequestRefundDto,
): Promise<Order> {
  return orderApi.requestRefund(orderId, data);
}

export default orderApi;
