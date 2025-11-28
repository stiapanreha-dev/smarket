/**
 * Profile API Client
 *
 * API functions for user profile management
 */

import { apiClient } from './axios.config';
import type { User, UpdateProfileRequest, UpdateProfileResponse } from '@/types';

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await apiClient.get<User>('/users/me');
  return response.data;
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UpdateProfileRequest): Promise<User> => {
  const response = await apiClient.put<User>('/users/me', data);
  return response.data;
};

/**
 * Upload avatar image
 * Note: This is a placeholder. You'll need to implement file upload to S3
 */
export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  // TODO: Implement actual file upload endpoint
  // For now, return a placeholder URL
  // In production, this should upload to S3 and return the URL

  throw new Error('Avatar upload not yet implemented. Please use a direct URL for now.');
};
