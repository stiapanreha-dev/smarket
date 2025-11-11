/**
 * API Error Response Types
 * Based on NestJS standard error format
 */

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ValidationError {
  field: string;
  constraints: Record<string, string>;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

/**
 * User roles
 */
export type UserRole = 'customer' | 'merchant' | 'admin';

/**
 * Supported locales
 */
export type UserLocale = 'en' | 'ru' | 'ar';

/**
 * Supported currencies
 */
export type UserCurrency = 'USD' | 'EUR' | 'RUB' | 'AED';

/**
 * User Interface
 */
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  role: UserRole;
  locale: UserLocale;
  currency: UserCurrency;
  email_verified?: boolean;
  phone_verified?: boolean;
  metadata?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  locale?: UserLocale;
  currency?: UserCurrency;
  metadata?: Record<string, any>;
}

/**
 * Update Profile Response
 */
export interface UpdateProfileResponse {
  user: User;
}

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  locale?: UserLocale;
  currency?: UserCurrency;
}

/**
 * Register Response
 */
export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Me Response
 */
export interface MeResponse {
  user: User;
}

export class ApiError extends Error {
  statusCode: number;
  response?: ApiErrorResponse;

  constructor(
    statusCode: number,
    message: string,
    response?: ApiErrorResponse
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Common HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = typeof HttpStatus[keyof typeof HttpStatus];
