# Checkout Module

Multi-step checkout process with session management.

## Checkout Flow

1. **Cart Review** - User reviews cart items
2. **Shipping Info** - Enter/select shipping address (for physical goods)
3. **Payment Method** - Select payment provider
4. **Confirmation** - Review order and confirm
5. **Payment** - Process payment via provider
6. **Order Creation** - Create order after payment success

## Checkout Session

Checkout uses session-based state management:

```typescript
CheckoutSession {
  id: UUID
  user_id: UUID | null  // null for guests
  session_id: string     // guest session ID
  items: CartItem[]
  shipping_address: Address | null
  payment_method: string
  status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
  expires_at: Date
}
```

## Session Expiration

Checkout sessions expire after **30 minutes** of inactivity to prevent cart holding.

## Guest Checkout

Guests can checkout without registration:
- Uses same `x-session-id` as cart
- Email required for order confirmation
- Optional account creation after checkout

## Payment Integration

Checkout integrates with Payment module:
```typescript
// After checkout confirmation
const paymentIntent = await this.paymentService.createIntent({
  amount: checkoutSession.total,
  currency: checkoutSession.currency,
  checkout_session_id: checkoutSession.id,
});
```

## Order Creation Integration

**CRITICAL**: CheckoutService integrates with OrderService to create orders via `executeCheckoutSaga()`.

### Saga Pattern

The checkout completion follows a saga pattern for transaction coordination:

```typescript
async completeCheckout(sessionId: string, userId?: string): Promise<CheckoutSession> {
  return this.executeCheckoutSaga(sessionId, userId);
}
```

### Saga Steps (in order):

1. **Validate Session** - Ensure session exists and is in valid state
2. **Start Transaction** - Begin database transaction
3. **Create Order** - Call `OrderService.createOrderFromCheckout(sessionId, paymentIntentId?)`
4. **Commit Inventory** - Commit reserved inventory via `InventoryReservationService`
5. **Clear Cart** - Clear user's cart (non-critical, logs warning if fails)
6. **Update Session** - Mark session as COMPLETED with order ID
7. **Commit Transaction** - Persist all changes atomically

### Error Handling

- **Order Creation Failure** → Rollback transaction, mark session as FAILED, release inventory
- **Inventory Commit Failure** → Rollback transaction (creates orphaned order - needs manual cleanup)
- **Cart Clear Failure** → Log warning, continue checkout (non-critical operation)

### Payment Intent ID

Payment intent ID is extracted from session's `payment_details` JSONB field:

```typescript
const paymentIntentId = session.payment_details?.paymentIntentId;
await this.orderService.createOrderFromCheckout(session.id, paymentIntentId);
```

### Transaction Separation

**IMPORTANT**: CheckoutService and OrderService use **separate transactions**:

- CheckoutService transaction: Manages checkout session updates
- OrderService transaction: Manages order and line item creation

This separation ensures OrderService can be called independently while maintaining atomicity within each service.

### Compensating Transactions

If inventory commit fails after order creation, the system has an inconsistency issue. Future improvements:
- Implement compensating transaction to void/cancel the created order
- Add idempotency to allow safe retry
- Implement two-phase commit pattern

## Key Endpoints

- `POST /checkout/sessions` - Create new checkout session
- `PATCH /checkout/sessions/:id` - Update session (add shipping, payment method)
- `POST /checkout/sessions/:id/confirm` - Finalize checkout
- `GET /checkout/sessions/:id` - Get current session state

## Validation

Checkout validates:
- Cart items still available (stock check)
- Prices haven't changed
- Shipping address valid (for physical goods)
- Payment method supported

## Related

- See `modules/cart.md` for cart session management
- See `modules/payment.md` for payment processing
- See `modules/orders.md` for order creation after payment
