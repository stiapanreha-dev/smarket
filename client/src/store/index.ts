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
  useCartItems,
  useCartSummary,
  useCartTotal,
  useCartItemsCount,
  useCartLoading,
  useCartError,
  useLoadCart,
  useAddToCart,
  useUpdateQuantity,
  useRemoveCartItem,
  useClearCart,
  useClearCartError,
} from './cartStore';

// Export checkout store and hooks
export {
  useCheckoutStore,
  useCheckoutSession,
  useCheckoutStep,
  useCreateSession,
  useLoadSession,
  useUpdateShippingAddress,
  useUpdatePaymentMethod,
  useApplyPromoCode,
  useCompleteCheckout,
  useCancelSession,
  useGoToStep,
  useNextStep,
  usePreviousStep,
  useCheckoutLoading,
  useCheckoutErrorMessage,
  useClearCheckoutError,
} from './checkoutStore';

// Export notification store
export { useNotificationStore } from './notificationStore';
