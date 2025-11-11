/**
 * Checkout module TypeScript types
 * Based on backend CheckoutSession entity and DTOs
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Checkout step enum
 */
export enum CheckoutStep {
  CART_REVIEW = 'cart_review',
  SHIPPING_ADDRESS = 'shipping_address',
  PAYMENT_METHOD = 'payment_method',
  ORDER_REVIEW = 'order_review',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation',
}

/**
 * Checkout status enum
 */
export enum CheckoutStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

/**
 * Delivery method types (for future implementation)
 */
export enum DeliveryMethodType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  OVERNIGHT = 'overnight',
  PICKUP = 'pickup',
}

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Cart item snapshot in checkout session
 */
export interface CartItemSnapshot {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // In minor units (cents)
  currency: string;
  merchantId: string;
  type: 'physical' | 'digital' | 'service';
  productName: string;
  variantName?: string;
  sku?: string;
  metadata?: Record<string, any>;
}

/**
 * Address interface
 */
export interface Address {
  country: string;
  state?: string;
  city: string;
  street: string;
  street2?: string;
  postal_code: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

/**
 * Checkout totals
 */
export interface CheckoutTotals {
  subtotal: number; // In minor units
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  tax_rate?: number; // Percentage
  tax_details?: {
    rate: number;
    amount: number;
    jurisdiction: string;
  }[];
}

/**
 * Promo code application
 */
export interface PromoCodeApplication {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applied_at: Date;
}

/**
 * Delivery option (for UI selection)
 */
export interface DeliveryOption {
  type: DeliveryMethodType;
  name: string;
  description: string;
  price: number; // In minor units
  estimated_days: number;
  carrier?: string;
}

/**
 * Payment method (for UI)
 */
export interface PaymentMethod {
  type: PaymentMethodType;
  details?: Record<string, any>;
}

/**
 * Checkout session from backend
 */
export interface CheckoutSession {
  id: string;
  user_id: string | null;
  session_id: string | null;
  cart_snapshot: CartItemSnapshot[];
  step: CheckoutStep;
  shipping_address: Address | null;
  billing_address: Address | null;
  payment_method: PaymentMethodType | null;
  payment_details: Record<string, any> | null;
  totals: CheckoutTotals;
  promo_codes: PromoCodeApplication[] | null;
  status: CheckoutStatus;
  idempotency_key: string | null;
  order_id: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create checkout session request
 */
export interface CreateCheckoutSessionRequest {
  cart_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Update shipping address request
 */
export interface UpdateShippingAddressRequest extends Address {
  use_as_billing?: boolean; // If true, billing_address = shipping_address
}

/**
 * Update payment method request
 */
export interface UpdatePaymentMethodRequest {
  payment_method: PaymentMethodType;
  payment_details?: Record<string, any>; // Tokenized card data, PayPal email, etc.
}

/**
 * Apply promo code request
 */
export interface ApplyPromoCodeRequest {
  code: string;
}

/**
 * Complete checkout request
 */
export interface CompleteCheckoutRequest {
  idempotency_key?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map CheckoutStep to step number (1-4 for UI)
 */
export function getStepNumber(step: CheckoutStep): number {
  const stepMap: Record<CheckoutStep, number> = {
    [CheckoutStep.CART_REVIEW]: 1,
    [CheckoutStep.SHIPPING_ADDRESS]: 2,
    [CheckoutStep.PAYMENT_METHOD]: 3,
    [CheckoutStep.ORDER_REVIEW]: 4,
    [CheckoutStep.PAYMENT]: 4,
    [CheckoutStep.CONFIRMATION]: 4,
  };
  return stepMap[step] || 1;
}

/**
 * Map step number to CheckoutStep
 */
export function getCheckoutStep(stepNumber: number): CheckoutStep {
  const stepMap: Record<number, CheckoutStep> = {
    1: CheckoutStep.CART_REVIEW,
    2: CheckoutStep.SHIPPING_ADDRESS,
    3: CheckoutStep.PAYMENT_METHOD,
    4: CheckoutStep.ORDER_REVIEW,
  };
  return stepMap[stepNumber] || CheckoutStep.CART_REVIEW;
}

/**
 * Check if checkout session is expired
 */
export function isCheckoutExpired(session: CheckoutSession): boolean {
  return (
    new Date() > new Date(session.expires_at) &&
    session.status === CheckoutStatus.IN_PROGRESS
  );
}

/**
 * Check if session has physical items
 */
export function hasPhysicalItems(session: CheckoutSession): boolean {
  return session.cart_snapshot.some((item) => item.type === 'physical');
}

/**
 * Check if shipping is required
 */
export function requiresShipping(session: CheckoutSession): boolean {
  return hasPhysicalItems(session);
}

/**
 * Format checkout price from minor units
 */
export function formatCheckoutPrice(priceMinor: number, currency: string = 'USD'): string {
  const price = priceMinor / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Get total items count
 */
export function getTotalItemsCount(session: CheckoutSession): number {
  return session.cart_snapshot.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Get unique merchant IDs
 */
export function getMerchantIds(session: CheckoutSession): string[] {
  return [...new Set(session.cart_snapshot.map((item) => item.merchantId))];
}

/**
 * Validate if can proceed to next step
 */
export function canProceedToNextStep(session: CheckoutSession): boolean {
  switch (session.step) {
    case CheckoutStep.CART_REVIEW:
      // Can always proceed from cart review if items exist
      return session.cart_snapshot.length > 0;

    case CheckoutStep.SHIPPING_ADDRESS:
      // Need shipping address if physical items exist
      if (requiresShipping(session)) {
        return session.shipping_address !== null;
      }
      return true;

    case CheckoutStep.PAYMENT_METHOD:
      // Need payment method selected
      return session.payment_method !== null;

    case CheckoutStep.ORDER_REVIEW:
      // Ready for payment
      return true;

    default:
      return false;
  }
}

/**
 * Get payment method display name
 */
export function getPaymentMethodName(type: PaymentMethodType): string {
  const nameMap: Record<PaymentMethodType, string> = {
    [PaymentMethodType.CARD]: 'Credit/Debit Card',
    [PaymentMethodType.APPLE_PAY]: 'Apple Pay',
    [PaymentMethodType.GOOGLE_PAY]: 'Google Pay',
    [PaymentMethodType.BANK_TRANSFER]: 'Bank Transfer',
    [PaymentMethodType.PAYPAL]: 'PayPal',
    [PaymentMethodType.CRYPTO]: 'Cryptocurrency',
    [PaymentMethodType.CASH_ON_DELIVERY]: 'Cash on Delivery',
  };
  return nameMap[type] || type;
}

/**
 * Get delivery method display name
 */
export function getDeliveryMethodName(type: DeliveryMethodType): string {
  const nameMap: Record<DeliveryMethodType, string> = {
    [DeliveryMethodType.STANDARD]: 'Standard Delivery',
    [DeliveryMethodType.EXPRESS]: 'Express Delivery',
    [DeliveryMethodType.OVERNIGHT]: 'Overnight Delivery',
    [DeliveryMethodType.PICKUP]: 'Store Pickup',
  };
  return nameMap[type] || type;
}
