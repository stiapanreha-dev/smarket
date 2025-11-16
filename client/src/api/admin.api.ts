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

// ============================================================================
// API Methods
// ============================================================================

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

export const adminApi = {
  getUsers,
  getUserById,
  updateUserRole,
};

export default adminApi;
