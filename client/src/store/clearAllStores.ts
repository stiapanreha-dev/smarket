/**
 * Clear All Stores
 *
 * Centralized function to clear all Zustand stores on session expiration.
 * This is called from axios interceptor when 401 with no refresh token.
 * Separated to avoid circular dependencies between axios.config and stores.
 */

import { useAuthStore } from './authStore';
import { useWishlistStore } from './wishlistStore';
import { useCartStore } from './cartStore';
import { useNotificationStore } from './notificationStore';
import { useCheckoutStore } from './checkoutStore';

/**
 * Clear all persisted store state on session expiration
 * Called from axios interceptor when 401 with no refresh token
 */
export const clearAllStores = (): void => {
  console.log('[clearAllStores] Clearing all stores due to session expiration');

  // Clear auth state
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Clear other stores
  useWishlistStore.getState().reset();
  useCartStore.getState().reset();
  useNotificationStore.getState().reset();
  useCheckoutStore.getState().reset();
};
