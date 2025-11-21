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
