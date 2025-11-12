import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/react-query';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { CatalogPage, ProductPage } from './pages/Catalog';
import { SearchPage } from './pages/Search';
import { CartPage } from './pages/Cart';
import { WishlistPage } from './pages/Wishlist';
import { CheckoutPage } from './pages/Checkout';
import { OrdersPage, OrderDetailsPage } from './pages/Orders';
import { ProfilePage } from './pages/Profile';
import { NotificationsPage } from './pages/Notifications';
import {
  DashboardPage,
  ProductsPage,
  ProductFormPage,
  OrdersPage as MerchantOrdersPage,
} from './pages/Merchant';
import { ProtectedRoute } from './components/ProtectedRoute';
import './i18n/config'; // Initialize i18n
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/:id" element={<ProductPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Merchant Routes - Protected */}
          <Route element={<ProtectedRoute requiredRole="merchant" />}>
            <Route path="/merchant/dashboard" element={<DashboardPage />} />
            <Route path="/merchant/products" element={<ProductsPage />} />
            <Route path="/merchant/products/new" element={<ProductFormPage />} />
            <Route path="/merchant/products/:id/edit" element={<ProductFormPage />} />
            <Route path="/merchant/orders" element={<MerchantOrdersPage />} />
          </Route>
        </Routes>
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
  );
}

export default App;
