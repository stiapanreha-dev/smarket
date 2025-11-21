# Cart Module - Guest Session Management

**CRITICAL**: The cart system supports both authenticated users and guest users through session management.

## Architecture Overview

Cart data is stored in **Redis** using different key patterns:
- Authenticated users: `cart:user:{userId}`
- Guest users: `cart:session:{sessionId}`

## Backend Implementation

### Public Endpoints

**All cart endpoints are marked as `@Public()`** to allow guest access without JWT authentication.

### Session ID Handling

Session ID is read from `x-session-id` header (NOT from express-session):

```typescript
@Public()
@Post('items')
async addItem(
  @Headers('x-session-id') sessionId: string,
  @CurrentUser() user: User | null,
  @Body() dto: AddToCartDto
) {
  const cartKey = user
    ? `cart:user:${user.id}`
    : `cart:session:${sessionId}`;
  // ... add item to Redis
}
```

### Cart Merging

When a guest user logs in, their guest cart merges with their user cart:

```typescript
POST /cart/merge
Headers:
  x-session-id: guest-session-id-123
  Authorization: Bearer jwt-token
```

## Frontend Implementation

### Session ID Generation

Session ID is generated **once** and stored in localStorage as `guest_session_id`.

**In `client/src/api/axios.config.ts`:**
```typescript
// Generate or retrieve session ID
let sessionId = localStorage.getItem('guest_session_id');
if (!sessionId) {
  sessionId = crypto.randomUUID();
  localStorage.setItem('guest_session_id', sessionId);
}

// Axios interceptor adds header to all requests
axios.interceptors.request.use((config) => {
  config.headers['x-session-id'] = sessionId;
  return config;
});
```

### Session Persistence

- Session ID persists across page reloads
- Cart continuity maintained for guest users
- Upon login, guest cart automatically merges

## Key Files

**Backend:**
- `src/modules/cart/cart.controller.ts` - Cart endpoints with @Public()
- `src/modules/cart/cart.service.ts` - Redis cart operations

**Frontend:**
- `client/src/api/axios.config.ts` - Session ID generation and interceptor
- `client/src/store/cartStore.ts` - Cart state management

## Critical Rules

1. **Always mark cart endpoints as @Public()** - Guest access required
2. **Always read x-session-id header** - Not from express-session
3. **Frontend must always send x-session-id** - Axios interceptor handles this
4. **Merge carts on login** - Use /cart/merge endpoint
5. **Store session ID in localStorage** - For persistence across reloads

## Common Issues

**Cart not persisting for guests:**
- Check `x-session-id` header is being sent
- Verify session ID in localStorage
- Ensure axios interceptor is configured

**Cart not merging on login:**
- Verify /cart/merge endpoint is called after login
- Check both session ID and JWT token are sent

## Related

- See `modules/checkout.md` for checkout flow
- See `architecture/modules.md` for module overview
