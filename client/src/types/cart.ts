/**
 * Cart module TypeScript types
 * Based on backend interfaces: Cart, CartItem, CartSummary
 */

import { Product, ProductVariant } from './catalog';

// ============================================================================
// Enums
// ============================================================================

/**
 * Product types for cart items
 */
export type CartItemType = 'physical' | 'digital' | 'service';

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Cart item metadata (flexible for different product types)
 */
export interface CartItemMetadata {
  bookingDate?: string;
  bookingSlot?: string;
  customization?: Record<string, any>;
  [key: string]: any;
}

/**
 * Cart item from backend
 */
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // Price in minor units (cents) at time of adding
  currency: string;
  merchantId: string;
  type: CartItemType;
  metadata?: CartItemMetadata;
}

/**
 * Cart item with populated product data (used in store and UI)
 */
export interface CartItemWithProduct extends CartItem {
  id: string; // Composite ID: productId-variantId
  product?: Product;
  variant?: ProductVariant;
  totalPrice: number; // quantity * price
}

/**
 * Cart from backend
 */
export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
}

/**
 * Cart summary with totals
 */
export interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  merchantCount: number;
  itemsByMerchant: Record<string, CartItem[]>;
}

/**
 * Cart with populated products (used in store)
 */
export interface CartWithProducts extends Cart {
  items: CartItemWithProduct[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Add to cart request
 */
export interface AddToCartRequest {
  productId: string;
  variantId: string;
  quantity: number;
  metadata?: CartItemMetadata;
}

/**
 * Update cart item request
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Get cart response
 */
export interface GetCartResponse {
  cart: Cart;
  summary: CartSummary;
}

/**
 * Merge cart request
 */
export interface MergeCartRequest {
  guestSessionId: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate composite cart item ID
 */
export function getCartItemId(productId: string, variantId: string): string {
  return `${productId}-${variantId}`;
}

/**
 * Parse composite cart item ID
 */
export function parseCartItemId(itemId: string): { productId: string; variantId: string } {
  const [productId, variantId] = itemId.split('-');
  return { productId, variantId };
}

/**
 * Convert CartItem to CartItemWithProduct
 */
export function toCartItemWithProduct(
  item: CartItem,
  product?: Product,
  variant?: ProductVariant,
): CartItemWithProduct {
  return {
    ...item,
    id: getCartItemId(item.productId, item.variantId),
    product,
    variant,
    totalPrice: item.price * item.quantity,
  };
}

/**
 * Calculate subtotal from cart items
 */
export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculate total items count
 */
export function calculateItemsCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Format price from minor units to display format
 */
export function formatCartPrice(priceMinor: number, currency: string = 'USD'): string {
  const price = priceMinor / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}

/**
 * Check if cart is empty
 */
export function isCartEmpty(cart: Cart | null): boolean {
  return !cart || cart.items.length === 0;
}

/**
 * Group cart items by merchant
 */
export function groupItemsByMerchant(items: CartItem[]): Record<string, CartItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.merchantId]) {
      acc[item.merchantId] = [];
    }
    acc[item.merchantId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);
}
