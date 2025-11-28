/**
 * Customer Dashboard API Client
 *
 * API functions for customer dashboard, statistics, and payment history
 */

import { apiClient } from './axios.config';

// Types
export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  items_count: number;
}

export interface DashboardStats {
  totalOrders: number;
  totalSpent: number;
  currency: string;
  activeOrders: number;
  pendingActions: number;
  ordersByStatus: Record<string, number>;
  recentOrders: RecentOrder[];
}

export interface PaymentRefund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string;
  createdAt: string;
  processedAt?: string;
}

export interface PaymentItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  provider: string;
  status: string;
  amount: number;
  currency: string;
  capturedAmount: number;
  refundedAmount: number;
  createdAt: string;
  capturedAt?: string;
  refunds: PaymentRefund[];
}

export interface UserPaymentsResponse {
  payments: PaymentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetPaymentsParams {
  page?: number;
  limit?: number;
}

/**
 * Get dashboard statistics for current user
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/users/me/dashboard-stats');
  return response.data;
};

/**
 * Get payment history for current user
 */
export const getMyPayments = async (params: GetPaymentsParams = {}): Promise<UserPaymentsResponse> => {
  const response = await apiClient.get<UserPaymentsResponse>('/payments/my', {
    params: {
      page: params.page || 1,
      limit: params.limit || 20,
    },
  });
  return response.data;
};

/**
 * Format currency amount from cents to display string
 */
export const formatAmount = (amountInCents: number, currency: string = 'USD'): string => {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
