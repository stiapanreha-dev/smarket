# Auth Module

JWT-based authentication with Argon2 password hashing.

## Key Features

- JWT token generation and validation
- Password hashing with Argon2 (more secure than bcrypt)
- Registration and login endpoints
- Global `JwtAuthGuard` applied at app level
- `@Public()` decorator to bypass authentication

## Authentication Flow

1. **Registration**: User registers → Password hashed with Argon2 → User created
2. **Login**: User logs in → Password verified → JWT token generated
3. **Protected Routes**: JWT validated by global guard → User info extracted

## Key Components

- `auth.service.ts` - Authentication logic
- `jwt.strategy.ts` - JWT validation strategy
- `guards/jwt-auth.guard.ts` - Global JWT guard
- `decorators/public.decorator.ts` - @Public() decorator
- `decorators/current-user.decorator.ts` - @CurrentUser() decorator

## Usage

```typescript
// Public endpoint (no auth required)
@Public()
@Post('register')
async register(@Body() dto: RegisterDto) {
  return this.authService.register(dto);
}

// Protected endpoint (JWT required)
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

## Security Best Practices

1. **Never store plain passwords** - Always hash with Argon2
2. **Validate JWT on every request** - Global guard handles this
3. **Use @Public() sparingly** - Most endpoints should require auth
4. **Never expose sensitive data** - Filter user data before returning

## Related

- See `architecture/authentication.md` for architectural overview
- See `modules/user.md` for user management
