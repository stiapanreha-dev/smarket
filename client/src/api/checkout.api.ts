/**
 * Checkout API Client
 *
 * API client for checkout operations:
 * - Create and manage checkout sessions
 * - Update shipping address
 * - Update payment method
 * - Apply promo codes
 * - Complete checkout
 */

import { apiClient } from './axios.config';
import type {
  CheckoutSession,
  CreateCheckoutSessionDto,
  UpdateShippingAddressDto,
  UpdatePaymentMethodDto,
  ApplyPromoCodeDto,
  CompleteCheckoutDto,
} from '@/types';

const BASE_URL = '/api/v1/checkout';

/**
 * Checkout API
 */
export const checkoutApi = {
  /**
   * Create a new checkout session
   * POST /api/v1/checkout/sessions
   */
  createSession: async (dto?: CreateCheckoutSessionDto): Promise<CheckoutSession> => {
    const response = await apiClient.post<CheckoutSession>(`${BASE_URL}/sessions`, dto || {});
    return response.data;
  },

  /**
   * Get checkout session by ID
   * GET /api/v1/checkout/sessions/:id
   */
  getSession: async (sessionId: string): Promise<CheckoutSession> => {
    const response = await apiClient.get<CheckoutSession>(`${BASE_URL}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Update shipping address
   * PUT /api/v1/checkout/sessions/:id/shipping
   */
  updateShippingAddress: async (
    sessionId: string,
    dto: UpdateShippingAddressDto,
  ): Promise<CheckoutSession> => {
    const response = await apiClient.put<CheckoutSession>(
      `${BASE_URL}/sessions/${sessionId}/shipping`,
      dto,
    );
    return response.data;
  },

  /**
   * Update payment method
   * PUT /api/v1/checkout/sessions/:id/payment-method
   */
  updatePaymentMethod: async (
    sessionId: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<CheckoutSession> => {
    const response = await apiClient.put<CheckoutSession>(
      `${BASE_URL}/sessions/${sessionId}/payment-method`,
      dto,
    );
    return response.data;
  },

  /**
   * Apply promo code
   * POST /api/v1/checkout/sessions/:id/apply-promo
   */
  applyPromoCode: async (sessionId: string, dto: ApplyPromoCodeDto): Promise<CheckoutSession> => {
    const response = await apiClient.post<CheckoutSession>(
      `${BASE_URL}/sessions/${sessionId}/apply-promo`,
      dto,
    );
    return response.data;
  },

  /**
   * Complete checkout and create order
   * POST /api/v1/checkout/sessions/:id/complete
   */
  completeCheckout: async (sessionId: string, dto?: CompleteCheckoutDto): Promise<CheckoutSession> => {
    const response = await apiClient.post<CheckoutSession>(
      `${BASE_URL}/sessions/${sessionId}/complete`,
      dto || {},
    );
    return response.data;
  },

  /**
   * Cancel checkout session
   * DELETE /api/v1/checkout/sessions/:id
   */
  cancelSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`${BASE_URL}/sessions/${sessionId}`);
  },
};
