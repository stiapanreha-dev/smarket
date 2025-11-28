# Zustand State Management - CRITICAL PATTERNS

## Atomic Selectors Pattern

**CRITICAL**: Zustand selectors that return new objects on every render cause infinite re-render loops.

**Always use atomic selectors** that return single primitive values or stable references.

## ❌ WRONG (causes infinite loops)

```typescript
// Returns new object every time → infinite re-renders
export const useCartSummary = () =>
  useCartStore((state) => ({
    summary: state.summary,
    total: state.total,
    itemsCount: state.itemsCount,
  }));

// Usage in component
const { summary, total, itemsCount } = useCartSummary(); // ❌ INFINITE LOOP
```

## ✅ CORRECT (atomic selectors)

```typescript
// Each selector returns a single value
export const useCartSummary = () => useCartStore((state) => state.summary);
export const useCartTotal = () => useCartStore((state) => state.total);
export const useCartItemsCount = () => useCartStore((state) => state.itemsCount);

// Functions are stable in zustand, safe to return directly
export const useLoadCart = () => useCartStore((state) => state.loadCart);
export const useUpdateQuantity = () => useCartStore((state) => state.updateQuantity);
```

## Usage in Components

```typescript
// ❌ WRONG - Destructuring from object-returning selector
const { summary, total, itemsCount } = useCartSummary();

// ✅ CORRECT - Multiple atomic selectors
const summary = useCartSummary();
const total = useCartTotal();
const itemsCount = useCartItemsCount();
```

## Why `shallow` Doesn't Help

```typescript
// ❌ Still wrong - creating new object every render
const { summary, total } = useCartStore(
  (state) => ({
    summary: state.summary,
    total: state.total,
  }),
  shallow // ← Doesn't solve the problem!
);
```

`shallow` comparison doesn't help if you're creating new objects on every selector call. **Use atomic selectors instead.**

## Store Structure

```typescript
// Good store structure
interface CartStore {
  // State
  items: CartItem[];
  summary: CartSummary | null;
  total: number;
  isLoading: boolean;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (item: CartItem) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => void;
  reset: () => void; // Reset store to initial state
}
```

## Persist Middleware

Use persist middleware for localStorage sync:

```typescript
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // store implementation
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }), // Only persist items
    }
  )
);
```

## Store Reset Pattern

**CRITICAL**: All stores must implement a `reset()` action to clear state on session expiration.

```typescript
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      // Initial state
      items: [],
      summary: null,
      total: 0,
      isLoading: false,
      error: null,

      // Actions
      loadCart: async () => { /* ... */ },
      addItem: async (dto) => { /* ... */ },

      // ✅ REQUIRED: Reset action
      reset: () => {
        set({
          items: [],
          summary: null,
          total: 0,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

## Centralized Store Cleanup (Session Expiration)

**Pattern**: Use centralized `clearAllStores()` function to avoid circular dependencies.

**Location**: `client/src/store/clearAllStores.ts`

```typescript
/**
 * Clear All Stores
 *
 * Centralized function to clear all Zustand stores on session expiration.
 * This is called from axios interceptor when 401 with no refresh token.
 * Separated to avoid circular dependencies between axios.config and stores.
 */

import { useAuthStore } from './authStore';
import { useWishlistStore } from './wishlistStore';
import { useCartStore } from './cartStore';
import { useNotificationStore } from './notificationStore';
import { useCheckoutStore } from './checkoutStore';

/**
 * Clear all persisted store state on session expiration
 * Called from axios interceptor when 401 with no refresh token
 */
export const clearAllStores = (): void => {
  console.log('[clearAllStores] Clearing all stores due to session expiration');

  // Clear auth state (using setState for direct update)
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  // Clear other stores using their reset() actions
  useWishlistStore.getState().reset();
  useCartStore.getState().reset();
  useNotificationStore.getState().reset();
  useCheckoutStore.getState().reset();
};
```

**Usage in axios interceptor**:

```typescript
import { clearAllStores } from '@/store/clearAllStores';

// In response interceptor (401 handler)
if (status === HttpStatus.UNAUTHORIZED && !originalRequest._retry) {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    // No refresh token available - session expired
    clearTokens();
    clearAllStores(); // ← Clear all Zustand stores
    processQueue(new Error('No refresh token available'), null);
    isRefreshing = false;

    return Promise.reject(
      new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Session expired. Please login again.',
        data
      )
    );
  }

  // Try to refresh token...
  try {
    // refresh logic
  } catch (refreshError) {
    // Refresh failed - session expired
    clearTokens();
    clearAllStores(); // ← Clear all Zustand stores
    processQueue(refreshError as Error, null);
    isRefreshing = false;

    return Promise.reject(
      new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Session expired. Please login again.',
        data
      )
    );
  }
}
```

**Why this pattern?**

1. **Avoids circular dependencies**: axios.config can't import stores directly (stores import axios)
2. **Centralized cleanup**: All stores cleared in one place
3. **Consistent behavior**: Session expiration always clears all state
4. **Easy to maintain**: Adding new stores only requires updating one file

**Key rules for new stores:**

1. Implement `reset()` action that clears state
2. Add store to `clearAllStores()` function
3. Use `getState().reset()` to call reset action

## Debugging Re-renders

If you suspect infinite loops:

```typescript
// Add console.log to selector
export const useCartItems = () => {
  console.log('useCartItems called'); // Should only log on actual changes
  return useCartStore((state) => state.items);
};
```

If you see continuous logging, you have an infinite loop.

## Key Rules

1. **Always use atomic selectors** - return single values
2. **Never return new objects** - causes reference inequality
3. **Don't use shallow** - doesn't solve the problem
4. **Functions are safe** - stable references in zustand
5. **Avoid destructuring** - from object-returning selectors
6. **Implement reset()** - all stores must have reset action
7. **Use clearAllStores()** - for session expiration cleanup

## Related

- See `client/src/store/cartStore.ts` for correct implementation
- See `client/src/store/authStore.ts` for auth patterns
- See `client/src/store/clearAllStores.ts` for centralized cleanup
- See `client/src/api/axios.config.ts` for session expiration handling
