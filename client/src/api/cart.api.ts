/**
 * Cart API Client
 *
 * Handles all cart-related API requests:
 * - Get cart
 * - Add item to cart
 * - Update item quantity
 * - Remove item from cart
 * - Clear cart
 * - Merge guest cart with user cart
 */

import { apiClient } from './axios.config';
import type {
  Cart,
  CartSummary,
  GetCartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  MergeCartRequest,
} from '@/types';

/**
 * Cart API endpoints
 */
const CART_ENDPOINTS = {
  CART: '/cart',
  ITEMS: '/cart/items',
  ITEM: (itemId: string) => `/cart/items/${itemId}`,
  SUMMARY: '/cart/summary',
  MERGE: '/cart/merge',
} as const;

/**
 * Cart API client
 */
export const cartApi = {
  /**
   * Get current cart
   * Returns cart and summary
   */
  async getCart(): Promise<GetCartResponse> {
    const response = await apiClient.get<GetCartResponse>(CART_ENDPOINTS.CART);
    return response.data;
  },

  /**
   * Get cart summary only
   */
  async getCartSummary(): Promise<CartSummary> {
    const response = await apiClient.get<CartSummary>(CART_ENDPOINTS.SUMMARY);
    return response.data;
  },

  /**
   * Add item to cart
   */
  async addItem(data: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<Cart>(CART_ENDPOINTS.ITEMS, data);
    return response.data;
  },

  /**
   * Update item quantity
   * Setting quantity to 0 removes the item
   */
  async updateItem(itemId: string, data: UpdateCartItemRequest): Promise<Cart> {
    const response = await apiClient.put<Cart>(CART_ENDPOINTS.ITEM(itemId), data);
    return response.data;
  },

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<Cart> {
    const response = await apiClient.delete<Cart>(CART_ENDPOINTS.ITEM(itemId));
    return response.data;
  },

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<Cart> {
    const response = await apiClient.delete<Cart>(CART_ENDPOINTS.CART);
    return response.data;
  },

  /**
   * Merge guest cart into user cart
   * Called after user logs in to merge their guest cart
   */
  async mergeCart(data: MergeCartRequest): Promise<Cart> {
    const response = await apiClient.post<Cart>(CART_ENDPOINTS.MERGE, data);
    return response.data;
  },
};

export default cartApi;
