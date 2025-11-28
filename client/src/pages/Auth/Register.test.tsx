/**
 * Register Component Tests
 *
 * Tests for Register page functionality:
 * - Form validation
 * - Successful registration flow
 * - Error handling
 * - Wishlist and cart loading after registration
 * - Redirect behavior
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from './Register';
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
        'auth.register.title': 'Create Account',
        'auth.register.subtitle': 'Join us today',
        'auth.register.firstName': 'First Name',
        'auth.register.firstNamePlaceholder': 'Enter your first name',
        'auth.register.lastName': 'Last Name',
        'auth.register.lastNamePlaceholder': 'Enter your last name',
        'auth.register.email': 'Email',
        'auth.register.emailPlaceholder': 'Enter your email',
        'auth.register.password': 'Password',
        'auth.register.passwordPlaceholder': 'Create a password',
        'auth.register.confirmPassword': 'Confirm Password',
        'auth.register.confirmPasswordPlaceholder': 'Confirm your password',
        'auth.register.language': 'Language',
        'auth.register.currency': 'Currency',
        'auth.register.terms': 'I agree to the Terms & Conditions',
        'auth.register.submit': 'Create Account',
        'auth.register.or': 'or',
        'auth.register.hasAccount': 'Already have an account?',
        'auth.register.login': 'Sign In',
        'auth.validation.emailRequired': 'Email is required',
        'auth.validation.emailInvalid': 'Invalid email address',
        'auth.validation.passwordRequired': 'Password is required',
        'auth.validation.passwordMin': 'Password must be at least 8 characters',
        'auth.validation.passwordUppercase': 'Password must contain uppercase letter',
        'auth.validation.passwordNumber': 'Password must contain a number',
        'auth.validation.confirmPasswordRequired': 'Please confirm your password',
        'auth.validation.passwordsMismatch': 'Passwords must match',
        'auth.validation.firstNameRequired': 'First name is required',
        'auth.validation.lastNameRequired': 'Last name is required',
        'auth.validation.termsRequired': 'You must accept the terms',
        'auth.errors.emailExists': 'Email already exists',
      };
      return translations[key] || key;
    },
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
    },
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

describe('Register Component', () => {
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();
  const mockLoadWishlist = vi.fn();
  const mockLoadCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth store mock
    vi.mocked(useAuthStore).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      clearError: mockClearError,
      user: null,
      token: null,
      login: vi.fn(),
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

    mockRegister.mockResolvedValue(undefined);
    mockLoadWishlist.mockResolvedValue(undefined);
    mockLoadCart.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderRegister = () => {
    return render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render registration form', () => {
      renderRegister();

      expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
      expect(screen.getByText('Join us today')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByText('Language')).toBeInTheDocument();
      expect(screen.getByText('Currency')).toBeInTheDocument();
    });

    it('should render terms checkbox', () => {
      renderRegister();

      expect(
        screen.getByText('I agree to the Terms & Conditions')
      ).toBeInTheDocument();
    });

    it('should render login link', () => {
      renderRegister();

      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should display error message when present', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        isLoading: false,
        error: 'Registration failed',
        isAuthenticated: false,
        clearError: mockClearError,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderRegister();

      expect(screen.getByRole('alert')).toHaveTextContent('Registration failed');
    });
  });

  describe('Form Validation', () => {
    it('should validate required first name', async () => {
      const user = userEvent.setup();
      renderRegister();

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate required last name', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderRegister();

      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate password minimum length', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Short1');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must be at least 8 characters')
        ).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate password contains uppercase', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain uppercase letter')
        ).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate password contains number', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Password');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('Password must contain a number')
        ).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate passwords match', async () => {
      const user = userEvent.setup();
      renderRegister();

      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'DifferentPassword123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords must match')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should validate terms acceptance', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('You must accept the terms')).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Registration Flow', () => {
    it('should call register with correct data', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i agree to the terms/i,
      });
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe',
          locale: 'en',
          currency: 'USD',
        });
      });
    });

    it('should load wishlist after successful registration', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i agree to the terms/i,
      });
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoadWishlist).toHaveBeenCalled();
      });
    });

    it('should load cart after successful registration', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i agree to the terms/i,
      });
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoadCart).toHaveBeenCalled();
      });
    });

    it('should navigate to catalog after successful registration', async () => {
      const user = userEvent.setup();
      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i agree to the terms/i,
      });
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/catalog');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle registration failure', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Email already exists' } },
      });

      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const confirmPasswordInput = screen.getByLabelText('Confirm Password');
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /i agree to the terms/i,
      });
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'Password123');
      await user.type(confirmPasswordInput, 'Password123');
      await user.click(termsCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should clear error on unmount', () => {
      const { unmount } = renderRegister();

      unmount();

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should disable form during loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
        isLoading: true,
        error: null,
        isAuthenticated: false,
        clearError: mockClearError,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderRegister();

      const firstNameInput = screen.getByLabelText('First Name') as HTMLInputElement;
      const lastNameInput = screen.getByLabelText('Last Name') as HTMLInputElement;
      const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /loading/i });

      expect(firstNameInput.disabled).toBe(true);
      expect(lastNameInput.disabled).toBe(true);
      expect(emailInput.disabled).toBe(true);
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Redirect Logic', () => {
    it('should redirect to catalog if already authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        register: mockRegister,
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
        login: vi.fn(),
        logout: vi.fn(),
        refreshToken: vi.fn(),
        setUser: vi.fn(),
        setLoading: vi.fn(),
        setError: vi.fn(),
        fetchCurrentUser: vi.fn(),
      });

      renderRegister();

      expect(mockNavigate).toHaveBeenCalledWith('/catalog');
    });
  });
});
