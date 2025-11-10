/**
 * Axios Instance Configuration
 *
 * Configured Axios instance with:
 * - Base URL from environment variables
 * - JWT token authentication
 * - Automatic token refresh on 401
 * - Global error handling
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError, HttpStatus } from '@/types';
import type { ApiErrorResponse, RefreshTokenResponse } from '@/types';

// Storage keys for authentication tokens
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// Queue to hold requests while token is being refreshed
interface FailedRequestQueue {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}

let isRefreshing = false;
let failedRequestsQueue: FailedRequestQueue[] = [];

/**
 * Process queued requests after token refresh
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedRequestsQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedRequestsQueue = [];
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Save tokens to localStorage
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Remove tokens from localStorage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Create configured Axios instance
 */
const createAxiosInstance = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Request Interceptor
   * Adds JWT token to all requests
   */
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getAccessToken();

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor
   * Handles errors and automatic token refresh
   */
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle network errors
      if (!error.response) {
        console.error('Network error:', error.message);
        return Promise.reject(
          new ApiError(
            HttpStatus.SERVICE_UNAVAILABLE,
            'Network error. Please check your connection.',
            {
              statusCode: HttpStatus.SERVICE_UNAVAILABLE,
              message: 'Network error',
            }
          )
        );
      }

      const { status, data } = error.response;

      // Handle 401 Unauthorized - Attempt token refresh
      if (status === HttpStatus.UNAUTHORIZED && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue this request while token is being refreshed
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(instance(originalRequest));
              },
              reject: (err: Error) => {
                reject(err);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          // No refresh token available, redirect to login
          clearTokens();
          processQueue(new Error('No refresh token available'), null);
          isRefreshing = false;

          // Redirect to login page
          window.location.href = '/login';

          return Promise.reject(
            new ApiError(
              HttpStatus.UNAUTHORIZED,
              'Session expired. Please login again.',
              data
            )
          );
        }

        try {
          // Attempt to refresh token
          const response = await axios.post<RefreshTokenResponse>(
            `${baseURL}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token } = response.data;

          // Update access token (keep existing refresh token)
          localStorage.setItem(ACCESS_TOKEN_KEY, access_token);

          // Update authorization header
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }

          // Process queued requests
          processQueue(null, access_token);
          isRefreshing = false;

          // Retry original request
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh token failed, clear tokens and redirect to login
          clearTokens();
          processQueue(refreshError as Error, null);
          isRefreshing = false;

          window.location.href = '/login';

          return Promise.reject(
            new ApiError(
              HttpStatus.UNAUTHORIZED,
              'Session expired. Please login again.',
              data
            )
          );
        }
      }

      // Handle 403 Forbidden
      if (status === HttpStatus.FORBIDDEN) {
        console.error('Access forbidden:', data);
        return Promise.reject(
          new ApiError(
            HttpStatus.FORBIDDEN,
            'You do not have permission to perform this action.',
            data
          )
        );
      }

      // Handle 500 Internal Server Error
      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        console.error('Server error:', data);
        return Promise.reject(
          new ApiError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'An unexpected error occurred. Please try again later.',
            data
          )
        );
      }

      // Handle other errors
      const errorMessage = Array.isArray(data?.message)
        ? data.message.join(', ')
        : data?.message || error.message;

      return Promise.reject(new ApiError(status, errorMessage, data));
    }
  );

  return instance;
};

/**
 * Configured Axios instance
 * Use this for all API requests
 */
export const apiClient = createAxiosInstance();

/**
 * Helper function to check if error is an ApiError
 */
export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};

/**
 * Helper function to extract error message
 */
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default apiClient;
