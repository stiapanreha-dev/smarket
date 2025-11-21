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

## Related

- See `client/src/store/cartStore.ts` for correct implementation
- See `client/src/store/authStore.ts` for auth patterns
