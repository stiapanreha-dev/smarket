import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/react-query';
import { PageLoader } from './components/common';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { initSentry } from './utils/sentry';
import { initPerformanceMonitoring } from './utils/performance';
import './i18n/config'; // Initialize i18n
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';

// ===== EAGER LOADING =====
// Landing page - loaded immediately for best FCP
import Landing from './pages/Landing';

// ===== LAZY LOADING - AUTH PAGES =====
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));

// ===== LAZY LOADING - CATALOG PAGES =====
const CatalogPage = lazy(() =>
  import('./pages/Catalog').then((module) => ({ default: module.CatalogPage }))
);
const ProductPage = lazy(() =>
  import('./pages/Catalog').then((module) => ({ default: module.ProductPage }))
);

// ===== LAZY LOADING - SHOPPING FLOW =====
const SearchPage = lazy(() =>
  import('./pages/Search').then((module) => ({ default: module.SearchPage }))
);
const CartPage = lazy(() =>
  import('./pages/Cart').then((module) => ({ default: module.CartPage }))
);
const WishlistPage = lazy(() =>
  import('./pages/Wishlist').then((module) => ({ default: module.WishlistPage }))
);
const CheckoutPage = lazy(() =>
  import('./pages/Checkout').then((module) => ({ default: module.CheckoutPage }))
);

// ===== LAZY LOADING - USER PAGES =====
const OrdersPage = lazy(() =>
  import('./pages/Orders').then((module) => ({ default: module.OrdersPage }))
);
const OrderDetailsPage = lazy(() =>
  import('./pages/Orders').then((module) => ({ default: module.OrderDetailsPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/Profile').then((module) => ({ default: module.ProfilePage }))
);
const NotificationsPage = lazy(() =>
  import('./pages/Notifications').then((module) => ({
    default: module.NotificationsPage,
  }))
);

// ===== LAZY LOADING - MERCHANT PAGES (separate chunk) =====
const DashboardPage = lazy(() =>
  import('./pages/Merchant').then((module) => ({ default: module.DashboardPage }))
);
const ProductsPage = lazy(() =>
  import('./pages/Merchant').then((module) => ({ default: module.ProductsPage }))
);
const ProductFormPage = lazy(() =>
  import('./pages/Merchant').then((module) => ({ default: module.ProductFormPage }))
);
const MerchantOrdersPage = lazy(() =>
  import('./pages/Merchant').then((module) => ({ default: module.OrdersPage }))
);

function App() {
  // Initialize monitoring on mount
  useEffect(() => {
    // Initialize Sentry for error tracking
    initSentry();

    // Initialize performance monitoring
    initPerformanceMonitoring();
  }, []);

  return (
    <ErrorBoundary level="global">
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            {/* Network status banner */}
            <OfflineBanner />

            <Suspense fallback={<PageLoader text="Loading page..." />}>
              <Routes>
            {/* Landing - No Suspense needed (eager loaded) */}
            <Route path="/" element={<Landing />} />

            {/* Auth Routes */}
            <Route
              path="/login"
              element={
                <Suspense fallback={<PageLoader text="Loading login..." />}>
                  <Login />
                </Suspense>
              }
            />
            <Route
              path="/register"
              element={
                <Suspense fallback={<PageLoader text="Loading registration..." />}>
                  <Register />
                </Suspense>
              }
            />

            {/* Catalog Routes */}
            <Route
              path="/catalog"
              element={
                <Suspense fallback={<PageLoader text="Loading catalog..." />}>
                  <CatalogPage />
                </Suspense>
              }
            />
            <Route
              path="/catalog/:id"
              element={
                <Suspense fallback={<PageLoader text="Loading product..." />}>
                  <ProductPage />
                </Suspense>
              }
            />

            {/* Shopping Flow Routes */}
            <Route
              path="/search"
              element={
                <Suspense fallback={<PageLoader text="Loading search..." />}>
                  <SearchPage />
                </Suspense>
              }
            />
            <Route
              path="/cart"
              element={
                <Suspense fallback={<PageLoader text="Loading cart..." />}>
                  <CartPage />
                </Suspense>
              }
            />
            <Route
              path="/wishlist"
              element={
                <Suspense fallback={<PageLoader text="Loading wishlist..." />}>
                  <WishlistPage />
                </Suspense>
              }
            />
            <Route
              path="/checkout"
              element={
                <Suspense fallback={<PageLoader text="Loading checkout..." />}>
                  <CheckoutPage />
                </Suspense>
              }
            />

            {/* User Routes */}
            <Route
              path="/notifications"
              element={
                <Suspense fallback={<PageLoader text="Loading notifications..." />}>
                  <NotificationsPage />
                </Suspense>
              }
            />
            <Route
              path="/orders"
              element={
                <Suspense fallback={<PageLoader text="Loading orders..." />}>
                  <OrdersPage />
                </Suspense>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <Suspense fallback={<PageLoader text="Loading order details..." />}>
                  <OrderDetailsPage />
                </Suspense>
              }
            />
            <Route
              path="/profile"
              element={
                <Suspense fallback={<PageLoader text="Loading profile..." />}>
                  <ProfilePage />
                </Suspense>
              }
            />

            {/* Merchant Routes - Protected with separate chunk */}
            <Route element={<ProtectedRoute requiredRole="merchant" />}>
              <Route
                path="/merchant/dashboard"
                element={
                  <Suspense fallback={<PageLoader text="Loading dashboard..." />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/merchant/products"
                element={
                  <Suspense fallback={<PageLoader text="Loading products..." />}>
                    <ProductsPage />
                  </Suspense>
                }
              />
              <Route
                path="/merchant/products/new"
                element={
                  <Suspense fallback={<PageLoader text="Loading product form..." />}>
                    <ProductFormPage />
                  </Suspense>
                }
              />
              <Route
                path="/merchant/products/:id/edit"
                element={
                  <Suspense fallback={<PageLoader text="Loading product form..." />}>
                    <ProductFormPage />
                  </Suspense>
                }
              />
              <Route
                path="/merchant/orders"
                element={
                  <Suspense fallback={<PageLoader text="Loading orders..." />}>
                    <MerchantOrdersPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </Router>

      {/* React Query Devtools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
