/**
 * Checkout API Client
 *
 * Handles all checkout-related API requests:
 * - Create checkout session
 * - Get checkout session
 * - Update shipping address
 * - Update payment method
 * - Apply promo code
 * - Complete checkout
 * - Cancel checkout session
 */

import { apiClient } from './axios.config';
import type {
  CheckoutSession,
  CreateCheckoutSessionRequest,
  UpdateShippingAddressRequest,
  UpdatePaymentMethodRequest,
  ApplyPromoCodeRequest,
  CompleteCheckoutRequest,
} from '@/types';

/**
 * Checkout API endpoints
 */
const CHECKOUT_ENDPOINTS = {
  SESSIONS: '/checkout/sessions',
  SESSION: (sessionId: string) => `/checkout/sessions/${sessionId}`,
  SHIPPING: (sessionId: string) => `/checkout/sessions/${sessionId}/shipping`,
  PAYMENT_METHOD: (sessionId: string) => `/checkout/sessions/${sessionId}/payment-method`,
  APPLY_PROMO: (sessionId: string) => `/checkout/sessions/${sessionId}/apply-promo`,
  COMPLETE: (sessionId: string) => `/checkout/sessions/${sessionId}/complete`,
} as const;

/**
 * Checkout API client
 */
export const checkoutApi = {
  /**
   * Create a new checkout session from current cart
   */
  async createSession(data?: CreateCheckoutSessionRequest): Promise<CheckoutSession> {
    const response = await apiClient.post<CheckoutSession>(
      CHECKOUT_ENDPOINTS.SESSIONS,
      data || {},
    );
    return response.data;
  },

  /**
   * Get checkout session by ID
   */
  async getSession(sessionId: string): Promise<CheckoutSession> {
    const response = await apiClient.get<CheckoutSession>(
      CHECKOUT_ENDPOINTS.SESSION(sessionId),
    );
    return response.data;
  },

  /**
   * Update shipping address
   */
  async updateShippingAddress(
    sessionId: string,
    data: UpdateShippingAddressRequest,
  ): Promise<CheckoutSession> {
    const response = await apiClient.put<CheckoutSession>(
      CHECKOUT_ENDPOINTS.SHIPPING(sessionId),
      data,
    );
    return response.data;
  },

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    sessionId: string,
    data: UpdatePaymentMethodRequest,
  ): Promise<CheckoutSession> {
    const response = await apiClient.put<CheckoutSession>(
      CHECKOUT_ENDPOINTS.PAYMENT_METHOD(sessionId),
      data,
    );
    return response.data;
  },

  /**
   * Apply promo code to checkout session
   */
  async applyPromoCode(
    sessionId: string,
    data: ApplyPromoCodeRequest,
  ): Promise<CheckoutSession> {
    const response = await apiClient.post<CheckoutSession>(
      CHECKOUT_ENDPOINTS.APPLY_PROMO(sessionId),
      data,
    );
    return response.data;
  },

  /**
   * Complete checkout and create order
   */
  async completeCheckout(
    sessionId: string,
    data?: CompleteCheckoutRequest,
  ): Promise<CheckoutSession> {
    const response = await apiClient.post<CheckoutSession>(
      CHECKOUT_ENDPOINTS.COMPLETE(sessionId),
      data || {},
    );
    return response.data;
  },

  /**
   * Cancel checkout session
   */
  async cancelSession(sessionId: string): Promise<void> {
    await apiClient.delete(CHECKOUT_ENDPOINTS.SESSION(sessionId));
  },
};

export default checkoutApi;
