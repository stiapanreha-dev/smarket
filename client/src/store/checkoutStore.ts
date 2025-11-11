/**
 * Checkout Store
 *
 * Zustand store for managing multi-step checkout process:
 * - Checkout session management
 * - Step navigation with validation
 * - Shipping address management
 * - Delivery method selection
 * - Payment method management
 * - Order completion
 * - Backend API synchronization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkoutApi } from '@/api/checkout.api';
import type {
  CheckoutSession,
  Address,
  DeliveryOption,
  PaymentMethod,
  PaymentMethodType,
  CheckoutStep,
  CreateCheckoutSessionRequest,
  UpdateShippingAddressRequest,
  UpdatePaymentMethodRequest,
  ApplyPromoCodeRequest,
  CompleteCheckoutRequest,
} from '@/types';
import {
  getStepNumber,
  getCheckoutStep,
  canProceedToNextStep,
  requiresShipping,
  isCheckoutExpired,
} from '@/types';

/**
 * Checkout Store State
 */
interface CheckoutState {
  // State
  session: CheckoutSession | null;
  sessionId: string | null;
  currentStep: number; // 1-4 for UI
  shippingAddress: Address | null;
  deliveryMethod: DeliveryOption | null;
  paymentMethod: PaymentMethod | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: (request?: CreateCheckoutSessionRequest) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  setShippingAddress: (address: UpdateShippingAddressRequest) => Promise<void>;
  setDeliveryMethod: (method: DeliveryOption) => Promise<void>;
  setPaymentMethod: (method: PaymentMethod) => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
  nextStep: () => Promise<boolean>;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completeCheckout: (request?: CompleteCheckoutRequest) => Promise<void>;
  cancelSession: () => Promise<void>;
  validateCurrentStep: () => boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial empty state
 */
const initialState = {
  session: null,
  sessionId: null,
  currentStep: 1,
  shippingAddress: null,
  deliveryMethod: null,
  paymentMethod: null,
  isLoading: false,
  error: null,
};

/**
 * Checkout Store
 *
 * Usage:
 * ```tsx
 * const { session, currentStep, createSession, nextStep } = useCheckoutStore();
 *
 * // Create checkout session
 * await createSession();
 *
 * // Set shipping address
 * await setShippingAddress({
 *   country: 'US',
 *   city: 'New York',
 *   street: '123 Main St',
 *   postal_code: '10001',
 *   phone: '+1234567890'
 * });
 *
 * // Move to next step
 * await nextStep();
 *
 * // Set payment method
 * await setPaymentMethod({
 *   type: PaymentMethodType.CARD,
 *   details: { /* tokenized card data */ }
 * });
 *
 * // Complete checkout
 * await completeCheckout();
 * ```
 */
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Create a new checkout session from cart
       */
      createSession: async (request?: CreateCheckoutSessionRequest) => {
        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.createSession(request);

          set({
            session,
            sessionId: session.id,
            currentStep: getStepNumber(session.step),
            shippingAddress: session.shipping_address,
            paymentMethod: session.payment_method
              ? {
                  type: session.payment_method,
                  details: session.payment_details || undefined,
                }
              : null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to create checkout session';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Load existing checkout session
       */
      loadSession: async (sessionId: string) => {
        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.getSession(sessionId);

          // Check if session is expired
          if (isCheckoutExpired(session)) {
            throw new Error('Checkout session has expired');
          }

          set({
            session,
            sessionId: session.id,
            currentStep: getStepNumber(session.step),
            shippingAddress: session.shipping_address,
            paymentMethod: session.payment_method
              ? {
                  type: session.payment_method,
                  details: session.payment_details || undefined,
                }
              : null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to load checkout session';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Set shipping address
       */
      setShippingAddress: async (address: UpdateShippingAddressRequest) => {
        const { sessionId } = get();

        if (!sessionId) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.updateShippingAddress(sessionId, address);

          set({
            session,
            shippingAddress: session.shipping_address,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Failed to update shipping address';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Set delivery method (local state only - for future implementation)
       */
      setDeliveryMethod: async (method: DeliveryOption) => {
        // TODO: When backend supports delivery methods, call API here
        // For now, just update local state
        set({
          deliveryMethod: method,
        });
      },

      /**
       * Set payment method
       */
      setPaymentMethod: async (method: PaymentMethod) => {
        const { sessionId } = get();

        if (!sessionId) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.updatePaymentMethod(sessionId, {
            payment_method: method.type,
            payment_details: method.details,
          });

          set({
            session,
            paymentMethod: {
              type: session.payment_method as PaymentMethodType,
              details: session.payment_details || undefined,
            },
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update payment method';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Apply promo code
       */
      applyPromoCode: async (code: string) => {
        const { sessionId } = get();

        if (!sessionId) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.applyPromoCode(sessionId, { code });

          set({
            session,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to apply promo code';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Validate current step before proceeding
       */
      validateCurrentStep: () => {
        const { session, currentStep, shippingAddress, paymentMethod } = get();

        if (!session) {
          return false;
        }

        switch (currentStep) {
          case 1: // Cart review
            return session.cart_snapshot.length > 0;

          case 2: // Shipping address
            if (requiresShipping(session)) {
              return shippingAddress !== null;
            }
            return true;

          case 3: // Payment method
            return paymentMethod !== null;

          case 4: // Order review
            return true;

          default:
            return false;
        }
      },

      /**
       * Move to next step with validation
       */
      nextStep: async () => {
        const { currentStep, validateCurrentStep } = get();

        // Validate current step
        if (!validateCurrentStep()) {
          set({
            error: 'Please complete all required fields before proceeding',
          });
          return false;
        }

        // Max step is 4
        if (currentStep >= 4) {
          return false;
        }

        const nextStep = currentStep + 1;
        set({
          currentStep: nextStep,
          error: null,
        });

        return true;
      },

      /**
       * Move to previous step
       */
      previousStep: () => {
        const { currentStep } = get();

        // Min step is 1
        if (currentStep <= 1) {
          return;
        }

        set({
          currentStep: currentStep - 1,
          error: null,
        });
      },

      /**
       * Go to specific step (with basic validation)
       */
      goToStep: (step: number) => {
        if (step < 1 || step > 4) {
          return;
        }

        set({
          currentStep: step,
          error: null,
        });
      },

      /**
       * Complete checkout and create order
       */
      completeCheckout: async (request?: CompleteCheckoutRequest) => {
        const { sessionId, validateCurrentStep } = get();

        if (!sessionId) {
          throw new Error('No active checkout session');
        }

        // Final validation
        if (!validateCurrentStep()) {
          throw new Error('Please complete all required fields');
        }

        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.completeCheckout(sessionId, request);

          set({
            session,
            isLoading: false,
            error: null,
          });

          // Move to confirmation step
          set({ currentStep: 4 });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to complete checkout';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Cancel checkout session
       */
      cancelSession: async () => {
        const { sessionId } = get();

        if (!sessionId) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          await checkoutApi.cancelSession(sessionId);

          // Reset to initial state
          set({
            ...initialState,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to cancel checkout';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Reset checkout to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'checkout-storage', // localStorage key
      partialize: (state) => ({
        // Persist session data but not loading/error states
        sessionId: state.sessionId,
        currentStep: state.currentStep,
        shippingAddress: state.shippingAddress,
        deliveryMethod: state.deliveryMethod,
        paymentMethod: state.paymentMethod,
      }),
    },
  ),
);

/**
 * Selector hooks for better performance
 * Use these instead of destructuring the entire store
 */
export const useCheckoutSession = () =>
  useCheckoutStore((state) => ({
    session: state.session,
    sessionId: state.sessionId,
  }));

export const useCheckoutStep = () =>
  useCheckoutStore((state) => ({
    currentStep: state.currentStep,
    goToStep: state.goToStep,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
  }));

export const useCheckoutData = () =>
  useCheckoutStore((state) => ({
    shippingAddress: state.shippingAddress,
    deliveryMethod: state.deliveryMethod,
    paymentMethod: state.paymentMethod,
  }));

export const useCheckoutActions = () =>
  useCheckoutStore((state) => ({
    createSession: state.createSession,
    loadSession: state.loadSession,
    setShippingAddress: state.setShippingAddress,
    setDeliveryMethod: state.setDeliveryMethod,
    setPaymentMethod: state.setPaymentMethod,
    applyPromoCode: state.applyPromoCode,
    completeCheckout: state.completeCheckout,
    cancelSession: state.cancelSession,
    validateCurrentStep: state.validateCurrentStep,
  }));

export const useCheckoutLoading = () => useCheckoutStore((state) => state.isLoading);

export const useCheckoutError = () =>
  useCheckoutStore((state) => ({
    error: state.error,
    setError: state.setError,
    clearError: state.clearError,
  }));
