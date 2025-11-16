/**
 * ProtectedRoute Component
 *
 * A wrapper component for protecting routes that require authentication.
 * Supports optional role-based access control.
 *
 * Usage:
 * ```tsx
 * // Basic authentication check
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/orders" element={<OrdersPage />} />
 * </Route>
 *
 * // With role requirement
 * <Route element={<ProtectedRoute requiredRole="merchant" />}>
 *   <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
 * </Route>
 * ```
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  /**
   * Required user role to access this route
   * If not specified, only authentication is required
   */
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({ requiredRole }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullPage text="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} replace />;
  }

  // Check role if required
  // Admins have access to all routes
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    // User is authenticated but doesn't have the required role
    // Redirect to home page or show forbidden page
    return <Navigate to="/" replace />;
  }

  // User is authenticated (and has required role if specified)
  // Render child routes
  return <Outlet />;
};

export default ProtectedRoute;
