/**
 * Login Component Tests
 *
 * Tests for Login page functionality:
 * - Form validation
 * - Successful login flow
 * - Error handling
 * - Wishlist and cart loading after login
 * - Redirect behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock stores
vi.mock('@/store/authStore');
vi.mock('@/store/wishlistStore');
vi.mock('@/store/cartStore');

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'auth.login.title': 'Sign In',
        'auth.login.subtitle': 'Welcome back!',
        'auth.login.email': 'Email',
        'auth.login.emailPlaceholder': 'Enter your email',
        'auth.login.password': 'Password',
        'auth.login.passwordPlaceholder': 'Enter your password',
        'auth.login.rememberMe': 'Remember me',
        'auth.login.forgotPassword': 'Forgot password?',
        'auth.login.submit': 'Sign In',
        'auth.login.or': 'or',
        'auth.login.noAccount': "Don't have an account?",
        'auth.login.register': 'Sign Up',
        'auth.validation.emailRequired': 'Email is required',
        'auth.validation.emailInvalid': 'Invalid email address',
        'auth.validation.passwordRequired': 'Password is required',
        'auth.validation.passwordMin': 'Password must be at least 6 characters',
        'auth.errors.invalidCredentials': 'Invalid email or password',
      };
      return translations[key] || key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock common components
vi.mock('@/components/common', () => ({
  Button: ({ children, loading, ...props }: any) => (
    <button {...props} disabled={loading}>
      {loading ? 'Loading...' : children}
    </button>
  ),
  Input: ({ label, error, name, ...props }: any) => (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} aria-label={label} {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  Alert: ({ children, onClose }: any) => (
    <div role="alert">
      {children}
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();
  const mockLoadWishlist = vi.fn();
  const mockLoadCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth store mock
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      clearError: mockClearError,
      user: null,
      token: null,
      register: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      setUser: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      fetchCurrentUser: vi.fn(),
    });

    // Setup wishlist store mock
    vi.mocked(useWishlistStore.getState).mockReturnValue({
      loadWishlist: mockLoadWishlist,
      reset: vi.fn(),
    } as any);

    // Setup cart store mock
    vi.mocked(useCartStore.getState).mockReturnValue({
      loadCart: mockLoadCart,
      clearCart: vi.fn(),
    } as any);

    mockLogin.mockResolvedValue(undefined);
    mockLoadWishlist.mockResolvedValue(undefined);
    mockLoadCart.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render login form', () => {
      renderLogin();

      expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByText('Remember me')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render register link', () => {
      renderLogin();

      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should display error message when present', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Invalid credentials',
        isAuthenticated: false,
        clearError: mockClearError,
        user: null,
        token: null,
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderLogin();

      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
  });

  describe('Form Validation', () => {
    it('should validate required email field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate required password field', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should validate password minimum length', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, '12345');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 6 characters')
        ).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Login Flow', () => {
    it('should call login with correct credentials', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should load wishlist after successful login', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoadWishlist).toHaveBeenCalled();
      });
    });

    it('should load cart after successful login', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoadCart).toHaveBeenCalled();
      });
    });

    it('should navigate to catalog after successful login', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
      });
    });

    it('should store rememberMe preference when checked', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /remember me/i });
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Check if localStorage was called (mocked in setup)
      expect(localStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
    });
  });

  describe('Error Handling', () => {
    it('should handle login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce({
        response: { status: 401 },
      });

      renderLogin();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });

      // Login should have been called but failed
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should clear error on unmount', () => {
      const { unmount } = renderLogin();

      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });

    it('should clear error when dismissing alert', async () => {
      const user = userEvent.setup();

      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: 'Some error occurred',
        isAuthenticated: false,
        clearError: mockClearError,
        user: null,
        token: null,
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderLogin();

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form during loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: true,
        error: null,
        isAuthenticated: false,
        clearError: mockClearError,
        user: null,
        token: null,
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderLogin();

      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /loading/i });

      expect(emailInput.disabled).toBe(true);
      expect(passwordInput.disabled).toBe(true);
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to catalog if already authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        login: mockLogin,
        isLoading: false,
        error: null,
        isAuthenticated: true,
        clearError: mockClearError,
        user: {
          id: '123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          locale: 'en',
          currency: 'USD',
        },
        token: 'mock-token',
        register: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderLogin();

      expect(mockNavigate).toHaveBeenCalledWith('/catalog');
    });
  });
});
