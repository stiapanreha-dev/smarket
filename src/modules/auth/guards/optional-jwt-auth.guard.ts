import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT authentication guard
 * Allows both authenticated and unauthenticated requests
 * Useful for checkout where guests can checkout without account
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, _info: any, _context: ExecutionContext) {
    // If there's an error or no user, just return null (allow request)
    // Controller logic will check if user exists
    return user || null;
  }
}
