/**
 * Axios Instance Configuration
 *
 * Configured Axios instance with:
 * - Base URL from environment variables
 * - JWT token authentication
 * - Automatic token refresh on 401
 * - Global error handling
 * - Exponential backoff retry logic
 * - Offline detection and request queueing
 */

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
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

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Base delay in ms
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504]; // Retryable HTTP status codes

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (retryCount: number): number => {
  return RETRY_DELAY * Math.pow(2, retryCount); // 1s, 2s, 4s
};

/**
 * Check if request should be retried
 */
const shouldRetry = (error: AxiosError, retryCount: number): boolean => {
  // Don't retry if max retries reached
  if (retryCount >= MAX_RETRIES) {
    return false;
  }

  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on specific status codes
  const status = error.response.status;
  return RETRY_STATUS_CODES.includes(status);
};

/**
 * Delay helper for retry logic
 */
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Check if browser is online
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Offline request queue
interface OfflineRequest {
  config: InternalAxiosRequestConfig;
  resolve: (value: AxiosResponse) => void;
  reject: (error: Error) => void;
}

let offlineRequestQueue: OfflineRequest[] = [];

/**
 * Process offline queue when connection is restored
 */
export const processOfflineQueue = async (instance: AxiosInstance) => {
  if (offlineRequestQueue.length === 0) {
    return;
  }

  console.log(`Processing ${offlineRequestQueue.length} queued requests...`);

  const queue = [...offlineRequestQueue];
  offlineRequestQueue = [];

  for (const request of queue) {
    try {
      const response = await instance(request.config);
      request.resolve(response);
    } catch (error) {
      request.reject(error as Error);
    }
  }
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
   * Handles errors, automatic token refresh, and retry logic
   */
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error: AxiosError<ApiErrorResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _retryCount?: number;
      };

      // Initialize retry count
      if (!originalRequest._retryCount) {
        originalRequest._retryCount = 0;
      }

      // Handle network errors with retry
      if (!error.response) {
        console.error('Network error:', error.message);

        // Check if browser is offline
        if (!isOnline()) {
          // Queue request for when connection is restored
          return new Promise((resolve, reject) => {
            offlineRequestQueue.push({
              config: originalRequest,
              resolve,
              reject,
            });
          });
        }

        // Retry network errors with exponential backoff
        if (shouldRetry(error, originalRequest._retryCount)) {
          originalRequest._retryCount++;
          const retryDelay = getRetryDelay(originalRequest._retryCount - 1);

          console.log(
            `Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) after ${retryDelay}ms...`
          );

          await delay(retryDelay);
          return instance(originalRequest);
        }

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

      // Retry on retryable status codes (except 401 which is handled separately)
      if (
        status !== HttpStatus.UNAUTHORIZED &&
        shouldRetry(error, originalRequest._retryCount)
      ) {
        originalRequest._retryCount++;
        const retryDelay = getRetryDelay(originalRequest._retryCount - 1);

        console.log(
          `Retrying request (${originalRequest._retryCount}/${MAX_RETRIES}) for status ${status} after ${retryDelay}ms...`
        );

        await delay(retryDelay);
        return instance(originalRequest);
      }

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
