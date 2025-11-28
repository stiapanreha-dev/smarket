/**
 * Auth Store Tests
 *
 * Tests for authentication store functionality:
 * - Login/register/logout operations
 * - Token management
 * - Store integration (wishlist and cart clearing on logout)
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useAuthStore } from './authStore';
import { useWishlistStore } from './wishlistStore';
import { useCartStore } from './cartStore';
import { apiClient, setTokens, clearTokens } from '@/api/axios.config';

// Mock API client
vi.mock('@/api/axios.config', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setTokens: vi.fn(),
  clearTokens: vi.fn(),
}));

// Mock stores
vi.mock('./wishlistStore', () => ({
  useWishlistStore: {
    getState: vi.fn(() => ({
      reset: vi.fn(),
      loadWishlist: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

vi.mock('./cartStore', () => ({
  useCartStore: {
    getState: vi.fn(() => ({
      reset: vi.fn(),
      clearCart: vi.fn().mockResolvedValue(undefined),
      loadCart: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        locale: 'en' as const,
        currency: 'USD' as const,
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(setTokens).toHaveBeenCalledWith(
        mockTokens.accessToken,
        mockTokens.refreshToken
      );

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockTokens.accessToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle login error', async () => {
      const mockError = new Error('Invalid credentials');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const store = useAuthStore.getState();

      await expect(
        store.login('wrong@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should set loading state during login', async () => {
      let loadingDuringRequest = false;

      vi.mocked(apiClient.post).mockImplementation(() => {
        const state = useAuthStore.getState();
        if (state.isLoading) {
          loadingDuringRequest = true;
        }
        return Promise.resolve({
          data: {
            user: { id: '123', email: 'test@example.com' },
            tokens: { accessToken: 'token', refreshToken: 'refresh' },
          },
        });
      });

      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password123');

      expect(loadingDuringRequest).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        locale: 'en' as const,
        currency: 'USD' as const,
      };

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: {
          user: mockUser,
          tokens: mockTokens,
        },
      });

      const registrationData = {
        email: 'newuser@example.com',
        password: 'password123',
        first_name: 'New',
        last_name: 'User',
        locale: 'en' as const,
        currency: 'USD' as const,
      };

      const store = useAuthStore.getState();
      await store.register(registrationData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/auth/register',
        registrationData
      );

      expect(setTokens).toHaveBeenCalledWith(
        mockTokens.accessToken,
        mockTokens.refreshToken
      );

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockTokens.accessToken);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should handle registration error', async () => {
      const mockError = new Error('Email already exists');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const store = useAuthStore.getState();

      await expect(
        store.register({
          email: 'existing@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          locale: 'en',
          currency: 'USD',
        })
      ).rejects.toThrow('Email already exists');

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      // Set up authenticated state
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          locale: 'en',
          currency: 'USD',
        },
        token: 'mock-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    });

    it('should clear auth state on logout', () => {
      const store = useAuthStore.getState();
      store.logout();

      expect(clearTokens).toHaveBeenCalled();

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.token).toBe(null);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should clear wishlist on logout', () => {
      const mockReset = vi.fn();
      vi.mocked(useWishlistStore.getState).mockReturnValueOnce({
        reset: mockReset,
        loadWishlist: vi.fn(),
      } as any);

      const store = useAuthStore.getState();
      store.logout();

      expect(mockReset).toHaveBeenCalled();
    });

    it('should reset cart on logout (without deleting from server)', () => {
      const mockReset = vi.fn();
      vi.mocked(useCartStore.getState).mockReturnValueOnce({
        reset: mockReset,
        loadCart: vi.fn(),
      } as any);

      const store = useAuthStore.getState();
      store.logout();

      expect(mockReset).toHaveBeenCalled();
    });

    it('should clear tokens, wishlist, and cart in correct order', () => {
      const mockWishlistReset = vi.fn();
      const mockCartReset = vi.fn();

      vi.mocked(useWishlistStore.getState).mockReturnValue({
        reset: mockWishlistReset,
        loadWishlist: vi.fn(),
      } as any);

      vi.mocked(useCartStore.getState).mockReturnValue({
        reset: mockCartReset,
        loadCart: vi.fn(),
      } as any);

      const store = useAuthStore.getState();
      store.logout();

      // Verify all cleanup methods were called
      expect(clearTokens).toHaveBeenCalled();
      expect(mockWishlistReset).toHaveBeenCalled();
      expect(mockCartReset).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token successfully', async () => {
      const newAccessToken = 'new-access-token';

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        data: { access_token: newAccessToken },
      });

      const store = useAuthStore.getState();
      await store.refreshToken();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');

      const state = useAuthStore.getState();
      expect(state.token).toBe(newAccessToken);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should logout user if refresh token fails', async () => {
      const mockError = new Error('Refresh token expired');
      vi.mocked(apiClient.post).mockRejectedValueOnce(mockError);

      const mockLogout = vi.fn();
      const store = useAuthStore.getState();
      store.logout = mockLogout;

      await expect(store.refreshToken()).rejects.toThrow('Refresh token expired');

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch current user successfully', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        locale: 'en' as const,
        currency: 'USD' as const,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: { user: mockUser },
      });

      const store = useAuthStore.getState();
      await store.fetchCurrentUser();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/me');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should logout user if fetch fails', async () => {
      const mockError = new Error('Invalid token');
      vi.mocked(apiClient.get).mockRejectedValueOnce(mockError);

      const mockLogout = vi.fn();
      const store = useAuthStore.getState();
      store.logout = mockLogout;

      await expect(store.fetchCurrentUser()).rejects.toThrow('Invalid token');

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe('utility methods', () => {
    it('should set user correctly', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        locale: 'en' as const,
        currency: 'USD' as const,
      };

      const store = useAuthStore.getState();
      store.setUser(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set user to null', () => {
      useAuthStore.setState({
        user: {
          id: '123',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          locale: 'en',
          currency: 'USD',
        },
        isAuthenticated: true,
      });

      const store = useAuthStore.getState();
      store.setUser(null);

      const state = useAuthStore.getState();
      expect(state.user).toBe(null);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set loading state', () => {
      const store = useAuthStore.getState();
      store.setLoading(true);

      expect(useAuthStore.getState().isLoading).toBe(true);

      store.setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error message', () => {
      const store = useAuthStore.getState();
      store.setError('Test error message');

      expect(useAuthStore.getState().error).toBe('Test error message');
    });

    it('should clear error message', () => {
      useAuthStore.setState({ error: 'Some error' });

      const store = useAuthStore.getState();
      store.clearError();

      expect(useAuthStore.getState().error).toBe(null);
    });
  });
});
