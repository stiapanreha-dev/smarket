/**
 * Store Mocks
 *
 * Mock implementations of Zustand stores for testing
 */

import { vi } from 'vitest';

/**
 * Mock Wishlist Store
 */
export const mockWishlistStore = {
  wishlist: null,
  items: [],
  itemCount: 0,
  isLoading: false,
  error: null,
  loadWishlist: vi.fn().mockResolvedValue(undefined),
  addToWishlist: vi.fn().mockResolvedValue(undefined),
  removeFromWishlist: vi.fn().mockResolvedValue(undefined),
  isInWishlist: vi.fn().mockReturnValue(false),
  clearWishlist: vi.fn().mockResolvedValue(undefined),
  syncWithBackend: vi.fn().mockResolvedValue(undefined),
  setLoading: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};

/**
 * Mock Cart Store
 */
export const mockCartStore = {
  cart: null,
  items: [],
  summary: null,
  total: 0,
  itemsCount: 0,
  isLoading: false,
  error: null,
  loadCart: vi.fn().mockResolvedValue(undefined),
  addItem: vi.fn().mockResolvedValue(undefined),
  updateQuantity: vi.fn().mockResolvedValue(undefined),
  removeItem: vi.fn().mockResolvedValue(undefined),
  clearCart: vi.fn().mockResolvedValue(undefined),
  syncWithBackend: vi.fn().mockResolvedValue(undefined),
  mergeGuestCart: vi.fn().mockResolvedValue(undefined),
  setLoading: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  reset: vi.fn(),
};

/**
 * Mock Auth Store
 */
export const mockAuthStore = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  refreshToken: vi.fn().mockResolvedValue(undefined),
  setUser: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
  clearError: vi.fn(),
  fetchCurrentUser: vi.fn().mockResolvedValue(undefined),
};

/**
 * Reset all store mocks
 */
export const resetStoreMocks = () => {
  vi.clearAllMocks();

  // Reset to initial states
  mockWishlistStore.wishlist = null;
  mockWishlistStore.items = [];
  mockWishlistStore.itemCount = 0;
  mockWishlistStore.isLoading = false;
  mockWishlistStore.error = null;

  mockCartStore.cart = null;
  mockCartStore.items = [];
  mockCartStore.summary = null;
  mockCartStore.total = 0;
  mockCartStore.itemsCount = 0;
  mockCartStore.isLoading = false;
  mockCartStore.error = null;

  mockAuthStore.user = null;
  mockAuthStore.token = null;
  mockAuthStore.isAuthenticated = false;
  mockAuthStore.isLoading = false;
  mockAuthStore.error = null;
};
