/**
 * Wishlist Types
 * Type definitions for wishlist functionality
 */

import { ProductType } from './catalog';
import type { Product } from './catalog';

/**
 * Wishlist item product details
 */
export interface WishlistItemProduct {
  id: string;
  title: string;
  slug: string;
  imageUrl: string | null;
  basePriceMinor: number | null;
  currency: string;
  status: string;
  merchantId: string;
  type?: ProductType;
}

/**
 * Wishlist item
 */
export interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string | Date;
  product?: WishlistItemProduct;
}

/**
 * Wishlist
 */
export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  itemCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Add to wishlist request
 */
export interface AddToWishlistRequest {
  productId: string;
}

/**
 * Wishlist response
 */
export interface WishlistResponse {
  id: string;
  userId: string;
  items: WishlistItem[];
  itemCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Check in wishlist response
 */
export interface CheckInWishlistResponse {
  inWishlist: boolean;
}

/**
 * Wishlist count response
 */
export interface WishlistCountResponse {
  count: number;
}
