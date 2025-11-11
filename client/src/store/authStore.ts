/**
 * Authentication Store
 *
 * Zustand store for managing authentication state:
 * - User authentication (login, register, logout)
 * - Token management (access token, refresh token)
 * - User profile state
 * - Persistent storage in localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient, setTokens, clearTokens } from '@/api/axios.config';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  MeResponse,
  RefreshTokenResponse,
} from '@/types';

/**
 * Auth Store State
 */
interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

/**
 * Authentication Store
 *
 * Usage:
 * ```tsx
 * const { user, login, logout, isAuthenticated } = useAuthStore();
 *
 * // Login
 * await login('user@example.com', 'password123');
 *
 * // Register
 * await register({
 *   email: 'user@example.com',
 *   password: 'password123',
 *   first_name: 'John',
 *   last_name: 'Doe'
 * });
 *
 * // Logout
 * logout();
 * ```
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * Login user with email and password
       */
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const payload: LoginRequest = { email, password };
          const response = await apiClient.post<LoginResponse>('/auth/login', payload);

          const { access_token, refresh_token, user } = response.data;

          // Save tokens to localStorage via axios.config helper
          setTokens(access_token, refresh_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed. Please try again.';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Register new user
       */
      register: async (userData: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<RegisterResponse>('/auth/register', userData);

          const { access_token, refresh_token, user } = response.data;

          // Save tokens to localStorage via axios.config helper
          setTokens(access_token, refresh_token);

          set({
            user,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Registration failed. Please try again.';

          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });

          throw error;
        }
      },

      /**
       * Logout user and clear all auth state
       */
      logout: () => {
        // Clear tokens from localStorage via axios.config helper
        clearTokens();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      /**
       * Refresh access token using refresh token
       * Note: axios.config.ts handles this automatically via interceptors
       */
      refreshToken: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh');

          const { access_token } = response.data;

          // Update access token in localStorage
          // Refresh token remains the same
          localStorage.setItem('access_token', access_token);

          set({
            token: access_token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Token refresh failed.';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // If refresh fails, logout user
          get().logout();

          throw error;
        }
      },

      /**
       * Set user data
       */
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: user !== null,
        });
      },

      /**
       * Set loading state
       */
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      /**
       * Set error message
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * Clear error message
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Fetch current user profile from backend
       * Useful for refreshing user data after token refresh
       */
      fetchCurrentUser: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.get<MeResponse>('/auth/me');

          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to fetch user data.';

          set({
            isLoading: false,
            error: errorMessage,
          });

          // If fetching user fails (e.g., invalid token), logout
          get().logout();

          throw error;
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage key
      partialize: (state) => ({
        // Only persist user and token, not loading/error states
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Selector hooks for better performance
 * Use these instead of destructuring the entire store
 */
export const useAuth = () => useAuthStore((state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
}));

export const useAuthUser = () => useAuthStore((state) => state.user);

export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  register: state.register,
  logout: state.logout,
  refreshToken: state.refreshToken,
  fetchCurrentUser: state.fetchCurrentUser,
}));

export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

export const useAuthError = () => useAuthStore((state) => ({
  error: state.error,
  clearError: state.clearError,
}));
