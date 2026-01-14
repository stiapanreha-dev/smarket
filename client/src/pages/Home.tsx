import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { PageLoader } from '@/components/common';

/**
 * Home Page
 * Redirects based on authentication status:
 * - Anonymous users -> Login page
 * - Authenticated users -> Appropriate dashboard based on role
 */
export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      // Not logged in - redirect to login
      navigate('/login', { replace: true });
    } else {
      // Logged in - redirect based on role
      if (user?.role === 'merchant') {
        navigate('/merchant/dashboard', { replace: true });
      } else if (user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        // Buyer role - redirect to catalog
        navigate('/catalog', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return <PageLoader text="Loading..." />;
}
