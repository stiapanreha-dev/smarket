import { User } from '@/database/entities/user.entity';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: TokenPair;
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {}
