# Frontend Source Structure

This document describes the organization of the SnailMarketplace frontend application.

## Directory Structure

```
src/
├── api/                    # API clients for backend modules
│   └── index.ts           # Barrel export for API clients
│
├── assets/                 # Static assets (images, fonts, etc.)
│
├── components/             # React components
│   ├── common/            # Reusable UI components (Button, Input, Card, etc.)
│   ├── features/          # Business logic specific components (ProductCard, CartItem, etc.)
│   └── layout/            # Layout components (Navbar, Footer, etc.)
│
├── constants/              # Application constants and enums
│   └── index.ts           # API base URL and other constants
│
├── hooks/                  # Custom React hooks
│   └── index.ts           # Barrel export for hooks
│
├── i18n/                   # Internationalization configuration
│   └── config.ts          # i18n setup
│
├── pages/                  # Page components (route views)
│   └── Landing.tsx        # Landing page
│
├── routes/                 # Routing configuration
│   └── index.ts           # React Router setup
│
├── store/                  # Zustand state management stores
│   └── index.ts           # Barrel export for stores
│
├── styles/                 # Global styles
│   └── custom.css         # Custom CSS
│
├── types/                  # TypeScript type definitions
│   └── index.ts           # Type exports
│
└── utils/                  # Utility functions and helpers
    └── index.ts           # Barrel export for utilities
```

## Module Guidelines

### API (`api/`)
Contains API client implementations for each backend module:
- `auth.ts` - Authentication endpoints
- `catalog.ts` - Product catalog
- `cart.ts` - Shopping cart
- `checkout.ts` - Checkout process
- `orders.ts` - Order management
- `payments.ts` - Payment processing

### Components (`components/`)

#### Common (`components/common/`)
Reusable, generic UI components that can be used throughout the application:
- Buttons
- Inputs
- Cards
- Modals
- Loaders
- Alerts

#### Features (`components/features/`)
Business logic specific components:
- ProductCard
- ProductList
- CartItem
- CheckoutForm
- OrderSummary
- PaymentForm

#### Layout (`components/layout/`)
Layout and navigation components:
- Navbar
- Footer
- Sidebar
- Header

### Store (`store/`)
Zustand stores for global state management:
- `authStore.ts` - Authentication state
- `cartStore.ts` - Shopping cart
- `catalogStore.ts` - Product catalog
- `checkoutStore.ts` - Checkout process
- `uiStore.ts` - UI state (modals, toasts, etc.)

### Hooks (`hooks/`)
Custom React hooks:
- `useAuth.ts` - Authentication logic
- `useCart.ts` - Cart operations
- `useProducts.ts` - Product data fetching
- `useLocale.ts` - Localization helpers
- `useDebounce.ts` - Debouncing utility

### Types (`types/`)
TypeScript interfaces and types:
- API response types
- Entity types (User, Product, Order, etc.)
- DTO types
- Utility types

### Utils (`utils/`)
Utility functions:
- `format.ts` - Date, currency formatting
- `validation.ts` - Validation helpers
- `api.ts` - API helper functions
- `storage.ts` - LocalStorage helpers

### Routes (`routes/`)
React Router configuration:
- Route definitions
- Protected route components
- Route guards

### Constants (`constants/`)
Application-wide constants:
- API endpoints
- Configuration values
- Enums
- Static data

## Import Guidelines

Use barrel exports (index.ts) for cleaner imports:

```typescript
// Good - using barrel exports
import { Navbar, Footer } from '@/components/layout';
import { useAuth, useCart } from '@/hooks';
import { API_BASE_URL } from '@/constants';

// Avoid - direct file imports
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
```

## Naming Conventions

- **Components**: PascalCase (e.g., `ProductCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Stores**: camelCase with 'Store' suffix (e.g., `authStore.ts`)
- **Utils**: camelCase (e.g., `formatCurrency.ts`)
- **Types**: PascalCase for interfaces/types (e.g., `User`, `Product`)
- **Constants**: UPPER_SNAKE_CASE for constants (e.g., `API_BASE_URL`)

## Best Practices

1. **Keep components focused**: Each component should have a single responsibility
2. **Reuse common components**: Use `components/common/` for shared UI elements
3. **Separate business logic**: Use custom hooks to extract business logic from components
4. **Type everything**: Use TypeScript types for all props, state, and API responses
5. **Use barrel exports**: Create index.ts files for easier imports
6. **Follow naming conventions**: Consistent naming improves code readability
