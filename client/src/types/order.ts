/**
 * Order Types
 *
 * TypeScript types for the orders module matching backend entities
 * Supports FSM-based order management for different product types
 */

import type { Product } from './catalog';

// ============================================================================
// Enums
// ============================================================================

/**
 * Main order status (overall order state)
 */
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Payment status for the order
 */
export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

/**
 * Line item product types
 */
export enum LineItemType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
}

/**
 * Physical item FSM states
 */
export enum PhysicalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

/**
 * Digital item FSM states
 */
export enum DigitalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCESS_GRANTED = 'access_granted',
  DOWNLOADED = 'downloaded',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

/**
 * Service item FSM states
 */
export enum ServiceItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  BOOKING_CONFIRMED = 'booking_confirmed',
  REMINDER_SENT = 'reminder_sent',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

/**
 * Union type for all line item statuses
 */
export type LineItemStatus = PhysicalItemStatus | DigitalItemStatus | ServiceItemStatus;

/**
 * Fulfillment status for line items
 */
export enum FulfillmentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Shipping/Billing address (reused from checkout)
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
 * Status history entry for line item FSM tracking
 */
export interface StatusHistoryEntry {
  from?: string;
  to: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Physical item fulfillment data
 */
export interface PhysicalFulfillmentData {
  warehouse_id?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
}

/**
 * Digital item fulfillment data
 */
export interface DigitalFulfillmentData {
  download_url?: string;
  access_key?: string;
  expires_at?: string;
  download_count?: number;
  max_downloads?: number;
}

/**
 * Service item fulfillment data
 */
export interface ServiceFulfillmentData {
  booking_id?: string;
  booking_date?: string;
  booking_slot?: string;
  specialist_id?: string;
  location?: string;
  notes?: string;
}

/**
 * Union type for fulfillment data
 */
export type FulfillmentData =
  | PhysicalFulfillmentData
  | DigitalFulfillmentData
  | ServiceFulfillmentData
  | Record<string, any>;

/**
 * Order line item (individual product in order)
 */
export interface OrderLineItem {
  id: string;
  order_id: string;
  merchant_id: string;
  product_id: string;
  variant_id: string | null;
  type: LineItemType;
  status: string; // Can be any of the specific status enums
  // Product snapshot
  product_name: string;
  product_sku: string | null;
  variant_attributes: Record<string, any> | null;
  // Pricing (in minor units - cents)
  quantity: number;
  unit_price: number;
  total_price: number;
  currency: string;
  // Fulfillment
  fulfillment_status: FulfillmentStatus;
  fulfillment_data: FulfillmentData;
  // FSM tracking
  status_history: StatusHistoryEntry[];
  last_status_change: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  // Relations (populated when needed)
  product?: Product;
  // Computed properties
  is_cancellable?: boolean;
  is_refundable?: boolean;
}

/**
 * Main Order entity
 */
export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  currency: string;
  // Amounts (in minor units - cents)
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  // Guest checkout
  guest_email: string | null;
  guest_phone: string | null;
  // Addresses
  shipping_address: Address | null;
  billing_address: Address | null;
  // Payment
  payment_method: string | null;
  payment_status: PaymentStatus;
  payment_intent_id: string | null;
  // Metadata
  notes: string | null;
  metadata: Record<string, any>;
  checkout_session_id: string | null;
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // Relations
  line_items: OrderLineItem[];
  // Computed properties (from backend)
  customer_email?: string | null;
  has_physical_items?: boolean;
  has_digital_items?: boolean;
  has_service_items?: boolean;
  merchant_ids?: string[];
  is_multi_merchant?: boolean;
  total_items?: number;
  // Additional computed fields for frontend
  delivery_method?: string | null; // From checkout session if needed
}

/**
 * Order filters for listing/searching
 */
export interface OrderFilters {
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  merchant_id?: string;
  user_id?: string;
  date_from?: string; // ISO date
  date_to?: string; // ISO date
  search?: string; // Search by order number, email, etc.
  limit?: number;
  offset?: number;
  page?: number;
}

/**
 * Paginated orders response
 */
export interface PaginatedOrders {
  data: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    offset?: number;
  };
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * Cancel order request
 */
export interface CancelOrderDto {
  reason?: string;
}

/**
 * Request refund for order or line item
 */
export interface RequestRefundDto {
  line_item_id?: string; // If specified, refund only this line item
  reason: string;
  amount?: number; // Partial refund amount (in minor units)
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if line item is physical type
 */
export function isPhysicalLineItem(lineItem: OrderLineItem): boolean {
  return lineItem.type === LineItemType.PHYSICAL;
}

/**
 * Check if line item is digital type
 */
export function isDigitalLineItem(lineItem: OrderLineItem): boolean {
  return lineItem.type === LineItemType.DIGITAL;
}

/**
 * Check if line item is service type
 */
export function isServiceLineItem(lineItem: OrderLineItem): boolean {
  return lineItem.type === LineItemType.SERVICE;
}

/**
 * Check if order can be cancelled
 */
export function isOrderCancellable(order: Order): boolean {
  return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
}

/**
 * Check if order is completed
 */
export function isOrderCompleted(order: Order): boolean {
  return order.status === OrderStatus.COMPLETED;
}

/**
 * Check if order is cancelled
 */
export function isOrderCancelled(order: Order): boolean {
  return order.status === OrderStatus.CANCELLED;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format order total for display (converts from minor units)
 */
export function formatOrderTotal(order: Order): number {
  return order.total_amount / 100;
}

/**
 * Format line item price for display (converts from minor units)
 */
export function formatLineItemPrice(lineItem: OrderLineItem): number {
  return lineItem.total_price / 100;
}

/**
 * Get order status display text
 */
export function getOrderStatusText(status: OrderStatus): string {
  const statusMap: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'Pending',
    [OrderStatus.CONFIRMED]: 'Confirmed',
    [OrderStatus.PROCESSING]: 'Processing',
    [OrderStatus.COMPLETED]: 'Completed',
    [OrderStatus.CANCELLED]: 'Cancelled',
    [OrderStatus.REFUNDED]: 'Refunded',
    [OrderStatus.PARTIALLY_REFUNDED]: 'Partially Refunded',
  };
  return statusMap[status] || status;
}

/**
 * Get line item status display text
 */
export function getLineItemStatusText(status: string): string {
  // Convert snake_case to Title Case
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Calculate order total items count
 */
export function getTotalOrderItems(order: Order): number {
  return order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
}

/**
 * Get unique merchant IDs from order
 */
export function getOrderMerchantIds(order: Order): string[] {
  if (!order.line_items || order.line_items.length === 0) {
    return [];
  }
  return [...new Set(order.line_items.map((item) => item.merchant_id))];
}

/**
 * Check if order has physical items
 */
export function hasPhysicalItems(order: Order): boolean {
  return order.line_items?.some((item) => item.type === LineItemType.PHYSICAL) || false;
}

/**
 * Check if order has digital items
 */
export function hasDigitalItems(order: Order): boolean {
  return order.line_items?.some((item) => item.type === LineItemType.DIGITAL) || false;
}

/**
 * Check if order has service items
 */
export function hasServiceItems(order: Order): boolean {
  return order.line_items?.some((item) => item.type === LineItemType.SERVICE) || false;
}

/**
 * Format address for display
 */
export function formatOrderAddress(address: Address | null): string {
  if (!address) return 'N/A';

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

/**
 * Get customer display name from order
 */
export function getCustomerName(order: Order): string {
  if (order.shipping_address?.first_name) {
    const { first_name, last_name } = order.shipping_address;
    return [first_name, last_name].filter(Boolean).join(' ');
  }
  return order.customer_email || 'Guest';
}
