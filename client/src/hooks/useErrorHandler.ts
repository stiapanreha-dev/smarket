import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { ApiError, getErrorMessage, isApiError } from '../types/api';
import { useNavigate } from 'react-router-dom';

export interface ErrorHandlerOptions {
  /**
   * Show toast notification for errors
   * @default true
   */
  showToast?: boolean;

  /**
   * Custom toast message (overrides default error message)
   */
  toastMessage?: string;

  /**
   * Toast duration in milliseconds
   * @default 5000 (5 seconds for errors)
   */
  toastDuration?: number;

  /**
   * Redirect to a specific path on error
   */
  redirectTo?: string;

  /**
   * Redirect to login on 401 errors
   * @default false
   */
  redirectToLoginOn401?: boolean;

  /**
   * Log error to console (useful for debugging)
   * @default true in development
   */
  logToConsole?: boolean;

  /**
   * Log error to Sentry/monitoring service
   * @default true
   */
  logToSentry?: boolean;

  /**
   * Custom error handler callback
   */
  onError?: (error: Error | ApiError) => void;

  /**
   * Context information for error logging
   */
  context?: Record<string, any>;
}

/**
 * Custom hook for centralized error handling
 * Provides consistent error handling across the application
 *
 * @example
 * ```tsx
 * const { handleError, handleApiError } = useErrorHandler();
 *
 * try {
 *   await api.updateProfile(data);
 * } catch (error) {
 *   handleError(error, {
 *     toastMessage: 'Failed to update profile',
 *     logToSentry: true
 *   });
 * }
 * ```
 */
export function useErrorHandler() {
  const navigate = useNavigate();

  /**
   * Handle any error (generic or API error)
   */
  const handleError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const {
        showToast = true,
        toastMessage,
        toastDuration = 5000,
        redirectTo,
        redirectToLoginOn401 = false,
        logToConsole = import.meta.env.DEV,
        logToSentry = true,
        onError,
        context,
      } = options;

      // Convert unknown error to Error object
      let errorObj: Error | ApiError;
      if (error instanceof Error) {
        errorObj = error;
      } else if (typeof error === 'string') {
        errorObj = new Error(error);
      } else {
        errorObj = new Error('An unexpected error occurred');
      }

      // Log to console in development
      if (logToConsole) {
        console.error('Error caught by useErrorHandler:', errorObj, context);
      }

      // Get user-friendly error message
      const message = toastMessage || getErrorMessage(errorObj);

      // Show toast notification
      if (showToast) {
        toast.error(message, {
          duration: toastDuration,
          id: `error-${Date.now()}`, // Prevent duplicate toasts
        });
      }

      // Handle 401 Unauthorized
      if (isApiError(errorObj) && errorObj.statusCode === 401 && redirectToLoginOn401) {
        // Save current path for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        if (currentPath !== '/login') {
          sessionStorage.setItem('redirectAfterLogin', currentPath);
        }
        navigate('/login');
        return;
      }

      // Custom redirect
      if (redirectTo) {
        navigate(redirectTo);
      }

      // Log to Sentry
      if (logToSentry && window.Sentry) {
        window.Sentry.captureException(errorObj, {
          contexts: {
            error_handler: {
              ...context,
              message,
            },
          },
          level: 'error',
        });
      }

      // Custom error callback
      if (onError) {
        onError(errorObj);
      }
    },
    [navigate]
  );

  /**
   * Handle API-specific errors with enhanced features
   */
  const handleApiError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      if (!isApiError(error)) {
        handleError(error, options);
        return;
      }

      const apiError = error as ApiError;

      // Enhanced options for API errors
      const enhancedOptions: ErrorHandlerOptions = {
        ...options,
        context: {
          ...options.context,
          statusCode: apiError.statusCode,
          endpoint: apiError.response?.config?.url,
          method: apiError.response?.config?.method,
        },
      };

      // Handle specific status codes
      switch (apiError.statusCode) {
        case 400:
          // Bad Request - show validation errors if available
          if (apiError.response?.data?.errors) {
            const validationErrors = apiError.response.data.errors;
            if (Array.isArray(validationErrors)) {
              validationErrors.forEach((err: any) => {
                toast.error(err.message || err, { duration: 5000 });
              });
              return;
            }
          }
          break;

        case 401:
          // Unauthorized - handled by axios interceptor but can override
          enhancedOptions.redirectToLoginOn401 = options.redirectToLoginOn401 ?? true;
          break;

        case 403:
          // Forbidden - user doesn't have permission
          enhancedOptions.toastMessage =
            options.toastMessage || 'You do not have permission to perform this action';
          break;

        case 404:
          // Not Found
          enhancedOptions.toastMessage = options.toastMessage || 'The requested resource was not found';
          break;

        case 409:
          // Conflict - e.g., duplicate entry
          enhancedOptions.toastMessage = options.toastMessage || apiError.message;
          break;

        case 429:
          // Too Many Requests
          enhancedOptions.toastMessage =
            options.toastMessage || 'Too many requests. Please try again later.';
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Server errors
          enhancedOptions.toastMessage =
            options.toastMessage || 'Server error. Please try again later.';
          break;

        default:
          // Use default error message
          break;
      }

      handleError(apiError, enhancedOptions);
    },
    [handleError]
  );

  /**
   * Handle form validation errors
   * @param errors - Object with field names as keys and error messages as values
   */
  const handleFormErrors = useCallback((errors: Record<string, string>) => {
    Object.entries(errors).forEach(([field, message]) => {
      toast.error(`${field}: ${message}`, {
        duration: 5000,
        id: `form-error-${field}`,
      });
    });
  }, []);

  /**
   * Handle network errors (offline, timeout, etc.)
   */
  const handleNetworkError = useCallback(
    (error: unknown, options: ErrorHandlerOptions = {}) => {
      const enhancedOptions: ErrorHandlerOptions = {
        ...options,
        toastMessage:
          options.toastMessage ||
          'Network error. Please check your connection and try again.',
        toastDuration: options.toastDuration || 5000,
        context: {
          ...options.context,
          errorType: 'network',
        },
      };

      handleError(error, enhancedOptions);
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
    handleFormErrors,
    handleNetworkError,
  };
}

// Type declaration for Sentry on window
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, context?: any) => void;
    };
  }
}

export default useErrorHandler;
