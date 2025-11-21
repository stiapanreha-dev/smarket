# React Router Patterns

## Router Setup

The app uses React Router v6 for client-side routing.

## Route Structure

```typescript
// Main routes
<Routes>
  {/* Public routes */}
  <Route path="/" element={<HomePage />} />
  <Route path="/catalog" element={<CatalogPage />} />
  <Route path="/products/:id" element={<ProductPage />} />

  {/* Protected routes */}
  <Route element={<ProtectedRoute />}>
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/orders" element={<OrdersPage />} />
  </Route>

  {/* Merchant routes */}
  <Route element={<MerchantRoute />}>
    <Route path="/merchant/dashboard" element={<DashboardPage />} />
  </Route>

  {/* 404 */}
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

## Protected Routes

Require authentication:

```typescript
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
```

## Navigation

```typescript
import { useNavigate, Link } from 'react-router-dom';

// Programmatic navigation
const navigate = useNavigate();
navigate('/catalog');

// Link component
<Link to="/products/123">View Product</Link>
```

## Route Parameters

```typescript
import { useParams } from 'react-router-dom';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  // Use id to fetch product
};
```

## Query Parameters

```typescript
import { useSearchParams } from 'react-router-dom';

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category');
  const sort = searchParams.get('sort');

  // Update query params
  setSearchParams({ category: 'electronics', sort: 'price_asc' });
};
```

## Nested Routes

```typescript
<Route path="/merchant" element={<MerchantLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="products" element={<ProductsPage />} />
  <Route path="orders" element={<OrdersPage />} />
</Route>
```

## Lazy Loading

Code-split routes for performance:

```typescript
import { lazy, Suspense } from 'react';

const CatalogPage = lazy(() => import('./pages/CatalogPage'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/catalog" element={<CatalogPage />} />
  </Routes>
</Suspense>
```

## Related

- See `client/src/routes/` for route configuration
- See React Router docs: https://reactrouter.com/
