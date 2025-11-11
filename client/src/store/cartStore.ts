/**
 * Cart Store
 *
 * Zustand store for managing shopping cart state:
 * - Cart items with product data
 * - Add/remove/update cart items
 * - Cart summary and totals
 * - Persistent storage in localStorage
 * - Backend API synchronization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartApi } from '@/api';
import type {
  Cart,
  CartItem,
  CartItemWithProduct,
  CartSummary,
  AddToCartRequest,
  Product,
  ProductVariant,
} from '@/types';
import { getCartItemId, toCartItemWithProduct, calculateItemsCount } from '@/types';

/**
 * Cart Store State
 */
interface CartState {
  // State
  cart: Cart | null;
  items: CartItemWithProduct[];
  summary: CartSummary | null;
  total: number;
  itemsCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (request: AddToCartRequest, product?: Product, variant?: ProductVariant) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  mergeGuestCart: (guestSessionId: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Initial empty state
 */
const initialState = {
  cart: null,
  items: [],
  summary: null,
  total: 0,
  itemsCount: 0,
  isLoading: false,
  error: null,
};

/**
 * Shopping Cart Store
 *
 * Usage:
 * ```tsx
 * const { items, total, addItem, removeItem } = useCartStore();
 *
 * // Add item to cart
 * await addItem({
 *   productId: '123',
 *   variantId: '456',
 *   quantity: 1
 * }, product, variant);
 *
 * // Update quantity
 * await updateQuantity('123-456', 2);
 *
 * // Remove item
 * await removeItem('123-456');
 *
 * // Clear cart
 * await clearCart();
 * ```
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Load cart from backend
       */
      loadCart: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await cartApi.getCart();
          const { cart, summary } = response;

          // Convert cart items to CartItemWithProduct
          // Note: In a real app, you might want to fetch product data here
          const items: CartItemWithProduct[] = cart.items.map((item) =>
            toCartItemWithProduct(item),
          );

          set({
            cart,
            items,
            summary,
            total: summary.total,
            itemsCount: calculateItemsCount(cart.items),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load cart';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Add item to cart
       */
      addItem: async (
        request: AddToCartRequest,
        product?: Product,
        variant?: ProductVariant,
      ) => {
        try {
          set({ isLoading: true, error: null });

          const cart = await cartApi.addItem(request);

          // Convert cart items to CartItemWithProduct
          const items: CartItemWithProduct[] = cart.items.map((item) => {
            // Use provided product/variant for the newly added item
            const isNewItem =
              item.productId === request.productId &&
              item.variantId === request.variantId;

            return toCartItemWithProduct(
              item,
              isNewItem ? product : undefined,
              isNewItem ? variant : undefined,
            );
          });

          // Fetch summary
          const summary = await cartApi.getCartSummary();

          set({
            cart,
            items,
            summary,
            total: summary.total,
            itemsCount: calculateItemsCount(cart.items),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to add item to cart';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Update item quantity
       * Setting quantity to 0 removes the item
       */
      updateQuantity: async (itemId: string, quantity: number) => {
        try {
          set({ isLoading: true, error: null });

          const cart = await cartApi.updateItem(itemId, { quantity });

          // Convert cart items to CartItemWithProduct
          const items: CartItemWithProduct[] = cart.items.map((item) =>
            toCartItemWithProduct(item),
          );

          // Fetch summary
          const summary = await cartApi.getCartSummary();

          set({
            cart,
            items,
            summary,
            total: summary.total,
            itemsCount: calculateItemsCount(cart.items),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to update item quantity';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Remove item from cart
       */
      removeItem: async (itemId: string) => {
        try {
          set({ isLoading: true, error: null });

          const cart = await cartApi.removeItem(itemId);

          // Convert cart items to CartItemWithProduct
          const items: CartItemWithProduct[] = cart.items.map((item) =>
            toCartItemWithProduct(item),
          );

          // Fetch summary
          const summary = await cartApi.getCartSummary();

          set({
            cart,
            items,
            summary,
            total: summary.total,
            itemsCount: calculateItemsCount(cart.items),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to remove item from cart';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Clear all items from cart
       */
      clearCart: async () => {
        try {
          set({ isLoading: true, error: null });

          const cart = await cartApi.clearCart();

          set({
            cart,
            items: [],
            summary: null,
            total: 0,
            itemsCount: 0,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to clear cart';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Sync cart with backend
       * Useful for refreshing cart data after navigation or network reconnection
       */
      syncWithBackend: async () => {
        await get().loadCart();
      },

      /**
       * Merge guest cart into user cart after login
       */
      mergeGuestCart: async (guestSessionId: string) => {
        try {
          set({ isLoading: true, error: null });

          const cart = await cartApi.mergeCart({ guestSessionId });

          // Convert cart items to CartItemWithProduct
          const items: CartItemWithProduct[] = cart.items.map((item) =>
            toCartItemWithProduct(item),
          );

          // Fetch summary
          const summary = await cartApi.getCartSummary();

          set({
            cart,
            items,
            summary,
            total: summary.total,
            itemsCount: calculateItemsCount(cart.items),
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to merge carts';

          set({
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
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
       * Reset cart to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({
        // Only persist cart and items, not loading/error states
        cart: state.cart,
        items: state.items,
        summary: state.summary,
        total: state.total,
        itemsCount: state.itemsCount,
      }),
    },
  ),
);

/**
 * Selector hooks for better performance
 * Use these instead of destructuring the entire store
 */
export const useCart = () =>
  useCartStore((state) => ({
    cart: state.cart,
    items: state.items,
    total: state.total,
    itemsCount: state.itemsCount,
  }));

export const useCartItems = () => useCartStore((state) => state.items);

export const useCartSummary = () =>
  useCartStore((state) => ({
    summary: state.summary,
    total: state.total,
    itemsCount: state.itemsCount,
  }));

export const useCartActions = () =>
  useCartStore((state) => ({
    loadCart: state.loadCart,
    addItem: state.addItem,
    updateQuantity: state.updateQuantity,
    removeItem: state.removeItem,
    clearCart: state.clearCart,
    syncWithBackend: state.syncWithBackend,
    mergeGuestCart: state.mergeGuestCart,
  }));

export const useCartLoading = () => useCartStore((state) => state.isLoading);

export const useCartError = () =>
  useCartStore((state) => ({
    error: state.error,
    clearError: state.clearError,
  }));
