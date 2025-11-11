/**
 * Auth API Client
 *
 * API functions for authentication and password management
 */

import { apiClient } from './axios.config';

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

/**
 * Change user password
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  const response = await apiClient.post<ChangePasswordResponse>('/users/me/change-password', data);
  return response.data;
};
