import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requiredRole?: 'user' | 'merchant' | 'admin';
}

/**
 * ProtectedRoute - Wrapper for routes that require authentication
 *
 * @param children - Child components to render if authorized
 * @param requireAuth - Whether authentication is required (default: true)
 * @param requiredRole - Required user role to access the route
 */
const ProtectedRoute = ({
  children,
  requireAuth = true,
  requiredRole,
}: ProtectedRouteProps) => {
  const location = useLocation();

  // TODO: Replace with actual auth check from context/store
  const isAuthenticated = !!localStorage.getItem('token');

  // TODO: Replace with actual user data from context/store
  const userRole = localStorage.getItem('userRole') as 'user' | 'merchant' | 'admin' | null;

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return URL
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to unauthorized page or home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
