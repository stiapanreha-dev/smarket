# Authentication Architecture

## JWT-Based Authentication

The platform uses JWT (JSON Web Tokens) for stateless authentication.

## Global Guard

- **Global `JwtAuthGuard`** is applied at app level (see `app.module.ts`)
- All routes require authentication by default
- Controllers/routes use `@Public()` decorator to bypass authentication

## Public Routes Pattern

```typescript
@Controller('catalog')
export class CatalogController {
  @Public()  // ← Bypass JWT guard
  @Get('products')
  async getProducts() {
    // Public endpoint
  }

  @Get('my-products')
  async getMyProducts(@CurrentUser() user: User) {
    // Protected endpoint - requires JWT
  }
}
```

## User Information

Access current user in controllers:

```typescript
@Get('profile')
async getProfile(@CurrentUser() user: User) {
  return user;
}
```

## Password Hashing

- **Argon2** is used (more secure than bcrypt)
- Never store plain text passwords
- Hash on registration and login validation

```typescript
// Hash password
const hashedPassword = await argon2.hash(password);

// Verify password
const isValid = await argon2.verify(hashedPassword, password);
```

## Key Files

- `src/modules/auth/guards/jwt-auth.guard.ts` - JWT validation
- `src/modules/auth/decorators/public.decorator.ts` - @Public() decorator
- `src/modules/auth/decorators/current-user.decorator.ts` - @CurrentUser() decorator
- `app.module.ts` - Global guard registration

## Best Practices

1. **Use @Public() sparingly** - Most endpoints should require auth
2. **Never expose sensitive data** - Filter user data before returning
3. **Validate permissions** - Auth ≠ Authorization
4. **Use @CurrentUser()** - Don't parse JWT manually
