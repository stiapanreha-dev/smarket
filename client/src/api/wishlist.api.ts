/**
 * Wishlist API Client
 *
 * Handles all wishlist-related API requests:
 * - Get wishlist
 * - Add product to wishlist
 * - Remove product from wishlist
 * - Check if product is in wishlist
 * - Get wishlist count
 * - Clear wishlist
 */

import { apiClient } from './axios.config';
import type {
  Wishlist,
  WishlistResponse,
  AddToWishlistRequest,
  CheckInWishlistResponse,
  WishlistCountResponse,
} from '@/types';

/**
 * Wishlist API endpoints
 */
const WISHLIST_ENDPOINTS = {
  WISHLIST: '/wishlist',
  ITEMS: '/wishlist/items',
  ITEM: (productId: string) => `/wishlist/items/${productId}`,
  CHECK: (productId: string) => `/wishlist/check/${productId}`,
  COUNT: '/wishlist/count',
} as const;

/**
 * Wishlist API client
 */
export const wishlistApi = {
  /**
   * Get current user's wishlist
   */
  async getWishlist(): Promise<WishlistResponse> {
    const response = await apiClient.get<WishlistResponse>(WISHLIST_ENDPOINTS.WISHLIST);
    return response.data;
  },

  /**
   * Add product to wishlist
   */
  async addItem(data: AddToWishlistRequest): Promise<WishlistResponse> {
    const response = await apiClient.post<WishlistResponse>(WISHLIST_ENDPOINTS.ITEMS, data);
    return response.data;
  },

  /**
   * Remove product from wishlist
   */
  async removeItem(productId: string): Promise<WishlistResponse> {
    const response = await apiClient.delete<WishlistResponse>(
      WISHLIST_ENDPOINTS.ITEM(productId),
    );
    return response.data;
  },

  /**
   * Check if product is in wishlist
   */
  async checkInWishlist(productId: string): Promise<CheckInWishlistResponse> {
    const response = await apiClient.get<CheckInWishlistResponse>(
      WISHLIST_ENDPOINTS.CHECK(productId),
    );
    return response.data;
  },

  /**
   * Get wishlist item count
   */
  async getCount(): Promise<WishlistCountResponse> {
    const response = await apiClient.get<WishlistCountResponse>(WISHLIST_ENDPOINTS.COUNT);
    return response.data;
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<WishlistResponse> {
    const response = await apiClient.delete<WishlistResponse>(WISHLIST_ENDPOINTS.WISHLIST);
    return response.data;
  },
};

export default wishlistApi;
