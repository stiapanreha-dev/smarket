import { UserRole } from '@/database/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number; // issued at
  exp?: number; // expiration time
}
