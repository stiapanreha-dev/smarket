import { createBrowserRouter } from 'react-router-dom';
import { MainLayout, AuthLayout, DashboardLayout } from '../components/layout';
import ProtectedRoute from './ProtectedRoute';
import ErrorPage from '../pages/ErrorPage';
import NotFound from '../pages/NotFound';

// Page imports
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Catalog from '../pages/catalog/Catalog';
import ProductDetails from '../pages/catalog/ProductDetails';
import Cart from '../pages/cart/Cart';
import Checkout from '../pages/checkout/Checkout';
import OrdersList from '../pages/orders/OrdersList';
import OrderDetails from '../pages/orders/OrderDetails';
import Profile from '../pages/profile/Profile';
import MerchantDashboard from '../pages/merchant/MerchantDashboard';
import MerchantProducts from '../pages/merchant/MerchantProducts';
import MerchantOrders from '../pages/merchant/MerchantOrders';

/**
 * Router configuration for SnailMarketplace
 * Uses React Router v6 with createBrowserRouter
 */
export const router = createBrowserRouter([
  // Main Layout Routes (Public + Protected with Navbar/Footer)
  {
    path: '/',
    element: <MainLayout />,
    errorElement: <ErrorPage />,
    children: [
      // Public Routes
      {
        index: true,
        element: <Landing />,
      },
      {
        path: 'catalog',
        element: <Catalog />,
      },
      {
        path: 'catalog/:id',
        element: <ProductDetails />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      // Protected Routes
      {
        path: 'checkout',
        element: (
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        ),
      },
    ],
  },

  // Auth Layout Routes (Login, Register)
  {
    path: '/auth',
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
    ],
  },

  // Dashboard Layout Routes (Protected)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'orders',
        element: <OrdersList />,
      },
      {
        path: 'orders/:id',
        element: <OrderDetails />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      // Merchant Routes (Role-based protection)
      {
        path: 'merchant',
        children: [
          {
            path: 'dashboard',
            element: (
              <ProtectedRoute requiredRole="merchant">
                <MerchantDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'products',
            element: (
              <ProtectedRoute requiredRole="merchant">
                <MerchantProducts />
              </ProtectedRoute>
            ),
          },
          {
            path: 'orders',
            element: (
              <ProtectedRoute requiredRole="merchant">
                <MerchantOrders />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },

  // 404 Not Found
  {
    path: '*',
    element: <NotFound />,
  },
]);
