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
