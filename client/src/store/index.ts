/**
 * Zustand stores
 *
 * This directory contains global state management stores:
 * - authStore: Authentication state
 * - cartStore: Shopping cart state
 * - catalogStore: Product catalog state
 * - checkoutStore: Checkout process state
 * - etc.
 */

// Export auth store and hooks
export {
  useAuthStore,
  useAuth,
  useAuthUser,
  useAuthActions,
  useAuthLoading,
  useAuthError,
} from './authStore';

// Export cart store and hooks
export {
  useCartStore,
  useCart,
  useCartItems,
  useCartSummary,
  useCartActions,
  useCartLoading,
  useCartError,
} from './cartStore';

// Future stores:
// export { useCatalogStore } from './catalogStore';
