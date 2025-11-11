/**
 * API clients for backend modules
 *
 * This directory contains API client implementations for each backend module:
 * - auth: Authentication and authorization
 * - users: User management
 * - catalog: Product catalog
 * - cart: Shopping cart
 * - checkout: Checkout process
 * - orders: Order management
 * - payments: Payment processing
 * - notifications: Notification services
 */

// Export configured Axios instance and utilities
export {
  apiClient,
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  isApiError,
  getErrorMessage,
} from './axios.config';

// Export API clients
export * from './auth.api';
export * from './catalog.api';
export * from './cart.api';
export * from './checkout.api';
export * from './order.api';
export * from './profile.api';
