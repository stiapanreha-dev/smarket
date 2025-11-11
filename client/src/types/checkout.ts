/**
 * Checkout Types
 *
 * TypeScript types for the checkout process matching backend entities
 */

// Enums
export enum CheckoutStep {
  CART_REVIEW = 'cart_review',
  SHIPPING_ADDRESS = 'shipping_address',
  DELIVERY_METHOD = 'delivery_method',
  PAYMENT_METHOD = 'payment_method',
  ORDER_REVIEW = 'order_review',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation',
}

export enum CheckoutStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum DeliveryMethodType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PICKUP = 'pickup',
}

export enum PaymentMethodType {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

// Interfaces
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

export interface DeliveryOption {
  type: DeliveryMethodType;
  name: string;
  description: string;
  price: number; // In minor units (cents)
  currency: string;
  estimatedDays: {
    min: number;
    max: number;
  };
}

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

export interface PromoCodeApplication {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applied_at: Date;
}

export interface CheckoutSession {
  id: string;
  user_id: string | null;
  session_id: string | null;
  cart_snapshot: CartItemSnapshot[];
  step: CheckoutStep;
  shipping_address: Address | null;
  billing_address: Address | null;
  delivery_method: DeliveryMethodType | null;
  payment_method: PaymentMethodType | null;
  payment_details: Record<string, any> | null;
  totals: CheckoutTotals;
  promo_codes: PromoCodeApplication[] | null;
  status: CheckoutStatus;
  idempotency_key: string | null;
  order_id: string | null;
  order_number: string | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// DTOs
export interface CreateCheckoutSessionDto {
  sessionId?: string; // For guest checkout
  metadata?: Record<string, any>;
}

export interface UpdateShippingAddressDto {
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
  use_as_billing?: boolean; // If true, billing_address = shipping_address
}

export interface UpdateDeliveryMethodDto {
  delivery_method: DeliveryMethodType;
}

export interface UpdatePaymentMethodDto {
  payment_method: PaymentMethodType;
  payment_details?: Record<string, any>;
}

export interface ApplyPromoCodeDto {
  code: string;
}

export interface CompleteCheckoutDto {
  idempotency_key?: string;
}

export interface CompleteCheckoutResponse {
  order_id: string;
  order_number: string;
  status: CheckoutStatus;
}

// Type aliases for compatibility with checkout API
export type CreateCheckoutSessionRequest = CreateCheckoutSessionDto;
export type UpdateShippingAddressRequest = UpdateShippingAddressDto;
export type UpdateDeliveryMethodRequest = UpdateDeliveryMethodDto;
export type UpdatePaymentMethodRequest = UpdatePaymentMethodDto;
export type ApplyPromoCodeRequest = ApplyPromoCodeDto;
export type CompleteCheckoutRequest = CompleteCheckoutDto;

// Utility types
export interface ShippingAddressFormData {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  saveAddress?: boolean;
}

// Helper functions
export function hasPhysicalItems(session: CheckoutSession): boolean {
  return session.cart_snapshot.some((item) => item.type === 'physical');
}

export function requiresShipping(session: CheckoutSession): boolean {
  return hasPhysicalItems(session);
}

export function isExpired(session: CheckoutSession): boolean {
  return new Date() > new Date(session.expires_at) && session.status === CheckoutStatus.IN_PROGRESS;
}

export function getTotalItems(session: CheckoutSession): number {
  return session.cart_snapshot.reduce((sum, item) => sum + item.quantity, 0);
}

export function formatAddress(address: Address): string {
  const parts = [
    address.street,
    address.street2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ].filter(Boolean);

  return parts.join(', ');
}

export function convertFormDataToAddress(formData: ShippingAddressFormData): UpdateShippingAddressDto {
  const [firstName, ...lastNameParts] = formData.fullName.trim().split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    first_name: firstName,
    last_name: lastName || undefined,
    phone: formData.phone,
    street: formData.addressLine1,
    street2: formData.addressLine2,
    city: formData.city,
    state: formData.state,
    postal_code: formData.postalCode,
    country: formData.country,
  };
}

export function convertAddressToFormData(address: Address): ShippingAddressFormData {
  const fullName = [address.first_name, address.last_name].filter(Boolean).join(' ');

  return {
    fullName: fullName || '',
    phone: address.phone,
    addressLine1: address.street,
    addressLine2: address.street2,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country,
    saveAddress: false,
  };
}
