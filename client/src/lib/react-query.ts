/**
 * React Query Configuration
 *
 * Centralized configuration for @tanstack/react-query
 * Includes default options and QueryClient setup
 */

import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

/**
 * Default options for all queries
 */
const queryConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Time until data is considered stale (default: 0 = immediately stale)
      staleTime: 1 * 60 * 1000, // 1 minute

      // Time until inactive queries are garbage collected
      gcTime: 5 * 60 * 1000, // 5 minutes (previously cacheTime)

      // Retry failed requests
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch options
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch on network reconnect
      refetchOnMount: true, // Refetch on component mount

      // Error handling
      throwOnError: false, // Don't throw errors globally
    },
    mutations: {
      // Retry failed mutations
      retry: 1,
      retryDelay: 1000,

      // Error handling
      throwOnError: false,
    },
  },
};

/**
 * Create a new QueryClient instance
 * Use this for creating a fresh client (e.g., in tests)
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient(queryConfig);
};

/**
 * Default QueryClient instance
 * Use this throughout the application
 */
export const queryClient = createQueryClient();

/**
 * Query key prefixes for organization
 */
export const QUERY_KEYS = {
  AUTH: 'auth',
  USERS: 'users',
  CATALOG: 'catalog',
  CART: 'cart',
  CHECKOUT: 'checkout',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  NOTIFICATIONS: 'notifications',
} as const;

export default queryClient;
