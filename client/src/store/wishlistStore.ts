/**
 * Wishlist Store
 *
 * Zustand store for managing wishlist state:
 * - Wishlist items
 * - Add/remove items
 * - Check if product is in wishlist
 * - Persistent storage in localStorage
 * - Backend API synchronization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wishlistApi } from '@/api';
import type { Wishlist, WishlistItem, WishlistItemProduct } from '@/types';

/**
 * Wishlist Store State
 */
interface WishlistState {
  // State
  wishlist: Wishlist | null;
  items: WishlistItem[];
  itemCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadWishlist: () => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial empty state
 */
const initialState = {
  wishlist: null,
  items: [],
  itemCount: 0,
  isLoading: false,
  error: null,
};

/**
 * Wishlist Store
 *
 * Usage:
 * ```tsx
 * const { items, itemCount, addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();
 *
 * // Add to wishlist
 * await addToWishlist(productId);
 *
 * // Remove from wishlist
 * await removeFromWishlist(productId);
 *
 * // Check if in wishlist
 * const inWishlist = isInWishlist(productId);
 *
 * // Clear wishlist
 * await clearWishlist();
 * ```
 */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Load wishlist from backend
       */
      loadWishlist: async () => {
        try {
          set({ isLoading: true, error: null });

          const wishlist = await wishlistApi.getWishlist();

          set({
            wishlist,
            items: wishlist.items,
            itemCount: wishlist.itemCount,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load wishlist';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // Don't throw error, just log it
          console.error('Failed to load wishlist:', error);
        }
      },

      /**
       * Add product to wishlist
       */
      addToWishlist: async (productId: string) => {
        try {
          set({ isLoading: true, error: null });

          const wishlist = await wishlistApi.addItem({ productId });

          set({
            wishlist,
            items: wishlist.items,
            itemCount: wishlist.itemCount,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to add to wishlist';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Remove product from wishlist
       */
      removeFromWishlist: async (productId: string) => {
        try {
          set({ isLoading: true, error: null });

          const wishlist = await wishlistApi.removeItem(productId);

          set({
            wishlist,
            items: wishlist.items,
            itemCount: wishlist.itemCount,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to remove from wishlist';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Check if product is in wishlist
       */
      isInWishlist: (productId: string) => {
        const { items } = get();
        return items.some((item) => item.productId === productId);
      },

      /**
       * Clear entire wishlist
       */
      clearWishlist: async () => {
        try {
          set({ isLoading: true, error: null });

          const wishlist = await wishlistApi.clearWishlist();

          set({
            wishlist,
            items: [],
            itemCount: 0,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to clear wishlist';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Sync wishlist with backend
       * Useful for refreshing wishlist data after navigation or network reconnection
       */
      syncWithBackend: async () => {
        await get().loadWishlist();
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
       * Reset wishlist to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'wishlist-storage', // localStorage key
      partialize: (state) => ({
        // Only persist wishlist and items, not loading/error states
        wishlist: state.wishlist,
        items: state.items,
        itemCount: state.itemCount,
      }),
    },
  ),
);

/**
 * Selector hooks for better performance
 * Use these instead of destructuring the entire store
 */
export const useWishlist = () =>
  useWishlistStore((state) => ({
    wishlist: state.wishlist,
    items: state.items,
    itemCount: state.itemCount,
  }));

export const useWishlistItems = () => useWishlistStore((state) => state.items);

export const useWishlistCount = () => useWishlistStore((state) => state.itemCount);

export const useWishlistActions = () =>
  useWishlistStore((state) => ({
    loadWishlist: state.loadWishlist,
    addToWishlist: state.addToWishlist,
    removeFromWishlist: state.removeFromWishlist,
    isInWishlist: state.isInWishlist,
    clearWishlist: state.clearWishlist,
    syncWithBackend: state.syncWithBackend,
  }));

export const useWishlistLoading = () => useWishlistStore((state) => state.isLoading);

export const useWishlistError = () =>
  useWishlistStore((state) => ({
    error: state.error,
    clearError: state.clearError,
  }));
