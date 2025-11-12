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

// Export checkout store and hooks
export {
  useCheckoutStore,
  useCheckoutSession,
  useCheckoutStep,
  useCheckoutActions,
  useCheckoutLoading,
  useCheckoutError,
} from './checkoutStore';

// Export notification store
export { useNotificationStore } from './notificationStore';
