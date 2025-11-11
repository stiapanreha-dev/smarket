/**
 * Checkout Store
 *
 * Zustand store for managing checkout state:
 * - Checkout session management
 * - Multi-step checkout flow
 * - Shipping address management
 * - Payment method selection
 * - Promo code application
 * - Backend API synchronization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { checkoutApi } from '@/api/checkout.api';
import type {
  CheckoutSession,
  CheckoutStep,
  CreateCheckoutSessionDto,
  UpdateShippingAddressDto,
  UpdateDeliveryMethodDto,
  UpdatePaymentMethodDto,
  CompleteCheckoutResponse,
  DeliveryOption,
} from '@/types';
import { CheckoutStep as CheckoutStepEnum, requiresShipping } from '@/types';

/**
 * Checkout Store State
 */
interface CheckoutState {
  // State
  session: CheckoutSession | null;
  currentStep: CheckoutStep;
  deliveryOptions: DeliveryOption[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: (dto?: CreateCheckoutSessionDto) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  updateShippingAddress: (address: UpdateShippingAddressDto) => Promise<void>;
  loadDeliveryOptions: () => Promise<void>;
  updateDeliveryMethod: (delivery: UpdateDeliveryMethodDto) => Promise<void>;
  updatePaymentMethod: (payment: UpdatePaymentMethodDto) => Promise<void>;
  applyPromoCode: (code: string) => Promise<void>;
  completeCheckout: () => Promise<CompleteCheckoutResponse>;
  cancelSession: () => Promise<void>;
  goToStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  previousStep: () => void;
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
  currentStep: CheckoutStepEnum.CART_REVIEW as CheckoutStep,
  deliveryOptions: null,
  isLoading: false,
  error: null,
};

/**
 * Checkout step order for navigation
 */
const stepOrder: CheckoutStep[] = [
  CheckoutStepEnum.CART_REVIEW,
  CheckoutStepEnum.SHIPPING_ADDRESS,
  CheckoutStepEnum.DELIVERY_METHOD,
  CheckoutStepEnum.PAYMENT_METHOD,
  CheckoutStepEnum.ORDER_REVIEW,
  CheckoutStepEnum.PAYMENT,
  CheckoutStepEnum.CONFIRMATION,
];

/**
 * Get next step in the checkout flow
 * Skips shipping_address and delivery_method steps for digital-only orders
 */
function getNextStep(currentStep: CheckoutStep, session: CheckoutSession | null): CheckoutStep {
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return currentStep;
  }

  let nextStepIndex = currentIndex + 1;
  let nextStep = stepOrder[nextStepIndex];

  // Skip shipping and delivery for digital-only orders
  if (session && !requiresShipping(session)) {
    while (
      nextStepIndex < stepOrder.length &&
      (nextStep === CheckoutStepEnum.SHIPPING_ADDRESS || nextStep === CheckoutStepEnum.DELIVERY_METHOD)
    ) {
      nextStepIndex++;
      nextStep = stepOrder[nextStepIndex];
    }
  }

  return nextStep;
}

/**
 * Get previous step in the checkout flow
 * Skips shipping_address and delivery_method steps for digital-only orders
 */
function getPreviousStep(currentStep: CheckoutStep, session: CheckoutSession | null): CheckoutStep {
  const currentIndex = stepOrder.indexOf(currentStep);
  if (currentIndex <= 0) {
    return currentStep;
  }

  let prevStepIndex = currentIndex - 1;
  let prevStep = stepOrder[prevStepIndex];

  // Skip shipping and delivery for digital-only orders
  if (session && !requiresShipping(session)) {
    while (
      prevStepIndex >= 0 &&
      (prevStep === CheckoutStepEnum.SHIPPING_ADDRESS || prevStep === CheckoutStepEnum.DELIVERY_METHOD)
    ) {
      prevStepIndex--;
      prevStep = stepOrder[prevStepIndex];
    }
  }

  return prevStep;
}

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
 * // Update shipping address
 * await updateShippingAddress({
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   street: '123 Main St',
 *   city: 'New York',
 *   postal_code: '10001',
 *   country: 'US',
 *   phone: '+1234567890'
 * });
 *
 * // Navigate to next step
 * nextStep();
 * ```
 */
export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Create a new checkout session
       */
      createSession: async (dto?: CreateCheckoutSessionDto) => {
        try {
          set({ isLoading: true, error: null });

          const session = await checkoutApi.createSession(dto);

          // Start at shipping_address or payment_method based on cart contents
          const startStep = requiresShipping(session) ? CheckoutStepEnum.SHIPPING_ADDRESS : CheckoutStepEnum.PAYMENT_METHOD;

          set({
            session,
            currentStep: startStep,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to create checkout session';

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

          set({
            session,
            currentStep: session.step,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load checkout session';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Update shipping address
       */
      updateShippingAddress: async (address: UpdateShippingAddressDto) => {
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const updatedSession = await checkoutApi.updateShippingAddress(session.id, address);

          set({
            session: updatedSession,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update shipping address';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Load delivery options
       * Step 2: Delivery Method
       */
      loadDeliveryOptions: async () => {
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const deliveryOptions = await checkoutApi.getDeliveryOptions(session.id);

          set({
            deliveryOptions,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load delivery options';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Update delivery method
       * Step 2: Delivery Method
       */
      updateDeliveryMethod: async (delivery: UpdateDeliveryMethodDto) => {
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const updatedSession = await checkoutApi.updateDeliveryMethod(session.id, delivery);

          set({
            session: updatedSession,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update delivery method';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Update payment method
       */
      updatePaymentMethod: async (payment: UpdatePaymentMethodDto) => {
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const updatedSession = await checkoutApi.updatePaymentMethod(session.id, payment);

          set({
            session: updatedSession,
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
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const updatedSession = await checkoutApi.applyPromoCode(session.id, { code });

          set({
            session: updatedSession,
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
       * Complete checkout and create order
       */
      completeCheckout: async () => {
        const { session } = get();
        if (!session) {
          throw new Error('No active checkout session');
        }

        try {
          set({ isLoading: true, error: null });

          const response = await checkoutApi.completeCheckout(session.id);

          set({
            currentStep: CheckoutStepEnum.CONFIRMATION,
            isLoading: false,
            error: null,
          });

          return response;
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
        const { session } = get();
        if (!session) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          await checkoutApi.cancelSession(session.id);

          set({
            ...initialState,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to cancel checkout session';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Navigate to a specific step
       */
      goToStep: (step: CheckoutStep) => {
        set({ currentStep: step });
      },

      /**
       * Navigate to next step
       */
      nextStep: () => {
        const { currentStep, session } = get();
        const nextStep = getNextStep(currentStep, session);
        set({ currentStep: nextStep });
      },

      /**
       * Navigate to previous step
       */
      previousStep: () => {
        const { currentStep, session } = get();
        const prevStep = getPreviousStep(currentStep, session);
        set({ currentStep: prevStep });
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
        // Only persist session and current step, not loading/error states
        session: state.session,
        currentStep: state.currentStep,
      }),
    },
  ),
);

/**
 * Selector hooks for better performance
 * Use these instead of destructuring the entire store
 */
export const useCheckoutSession = () => useCheckoutStore((state) => state.session);

export const useCheckoutStep = () => useCheckoutStore((state) => state.currentStep);

export const useCheckoutActions = () =>
  useCheckoutStore((state) => ({
    createSession: state.createSession,
    loadSession: state.loadSession,
    updateShippingAddress: state.updateShippingAddress,
    updatePaymentMethod: state.updatePaymentMethod,
    applyPromoCode: state.applyPromoCode,
    completeCheckout: state.completeCheckout,
    cancelSession: state.cancelSession,
    goToStep: state.goToStep,
    nextStep: state.nextStep,
    previousStep: state.previousStep,
  }));

export const useCheckoutLoading = () => useCheckoutStore((state) => state.isLoading);

export const useCheckoutError = () =>
  useCheckoutStore((state) => ({
    error: state.error,
    clearError: state.clearError,
  }));
