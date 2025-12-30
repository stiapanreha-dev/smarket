/**
 * Admin API Client
 * API client for admin operations
 */

import { apiClient } from './axios.config';

// ============================================================================
// Types
// ============================================================================

export enum UserRole {
  BUYER = 'buyer',
  MERCHANT = 'merchant',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  email_verified: boolean;
  phone?: string;
  created_at: string;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface AdminDashboardStats {
  users: {
    total: number;
    byRole: Record<string, number>;
    newToday: number;
    newThisWeek: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    today: number;
  };
  revenue: {
    total: number;
    currency: string;
  };
  pendingMerchantApplications: number;
  recentOrders: Array<{
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    total_amount: number;
    currency: string;
    created_at: string;
    customer: {
      id: string;
      email: string;
      name: string;
    } | null;
  }>;
}

// ============================================================================
// API Methods
// ============================================================================

/**
 * Get admin dashboard statistics
 */
export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const response = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
  return response.data;
};

/**
 * Get all users with filters
 */
export const getUsers = async (params?: {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedUsers> => {
  const response = await apiClient.get<PaginatedUsers>('/admin/users', { params });
  return response.data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`/admin/users/${userId}`);
  return response.data;
};

/**
 * Update user role
 */
export const updateUserRole = async (
  userId: string,
  dto: UpdateUserRoleDto
): Promise<User> => {
  const response = await apiClient.patch<User>(`/admin/users/${userId}/role`, dto);
  return response.data;
};

// ============================================================================
// VAT Settings Types
// ============================================================================

export type VatMode = 'included' | 'on_top';

export interface VatSettings {
  mode: VatMode;
  default_rate: number;
  country_rates: Record<string, number>;
}

export interface UpdateVatSettingsDto {
  mode: VatMode;
  default_rate: number;
  country_rates: Record<string, number>;
}

// ============================================================================
// VAT Settings API Methods
// ============================================================================

/**
 * Get current VAT settings
 */
export const getVatSettings = async (): Promise<VatSettings> => {
  const response = await apiClient.get<{ data: VatSettings }>('/admin/settings/vat');
  return response.data.data;
};

/**
 * Update VAT settings
 */
export const updateVatSettings = async (dto: UpdateVatSettingsDto): Promise<VatSettings> => {
  const response = await apiClient.put<{ data: VatSettings }>('/admin/settings/vat', dto);
  return response.data.data;
};

export const adminApi = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserRole,
  getVatSettings,
  updateVatSettings,
};

export default adminApi;
