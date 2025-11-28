# Webhooks Module

Handles incoming webhook events from external payment providers (Stripe).

## Purpose

The Webhooks module processes asynchronous payment events from Stripe, enabling real-time order completion when payments succeed.

## Architecture

```
Stripe → Webhook Controller → StripePaymentService → CheckoutService
                                                            ↓
                                                      OrderService
```

## Key Components

### WebhooksController

**File:** `src/modules/webhooks/webhooks.controller.ts`

```typescript
@Public()  // ← Webhooks must be public (no JWT required)
@Controller('webhooks')
export class WebhooksController {
  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }>
}
```

**Key Points:**
- **@Public() decorator** - Webhooks bypass JWT authentication
- **Raw body required** - Stripe signature verification needs raw request body
- **stripe-signature header** - Contains webhook signature for verification

### WebhooksModule

**File:** `src/modules/webhooks/webhooks.module.ts`

```typescript
@Module({
  imports: [CheckoutModule],  // ← Imports CheckoutModule for completing orders
  controllers: [WebhooksController],
})
export class WebhooksModule {}
```

## Webhook Endpoint

```
POST /api/v1/webhooks/stripe
Headers:
  stripe-signature: <signature>
  Content-Type: application/json
Body: Raw Stripe event payload
```

## Supported Events

| Event | Handler | Action |
|-------|---------|--------|
| `payment_intent.succeeded` | `handlePaymentSuccess()` | Complete checkout, create order |
| `payment_intent.payment_failed` | `handlePaymentFailed()` | Log failure, mark session failed |
| `payment_intent.canceled` | `handlePaymentCanceled()` | Cancel checkout session |
| `charge.refunded` | `handleChargeRefunded()` | Process refund (TODO) |

## Payment Success Flow

```typescript
async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  // 1. Extract checkout session ID from metadata
  const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;

  // 2. Complete checkout and create order
  await this.checkoutService.completeCheckout(checkoutSessionId, null, {
    payment_intent_id: paymentIntent.id,
  });
}
```

## Signature Verification

Webhook signatures are verified using Stripe's library:

```typescript
const event = this.stripeService.verifyWebhookSignature(rawBody, signature);
```

This prevents:
- Replay attacks
- Forged webhook events
- Man-in-the-middle attacks

## Local Development

### Stripe CLI Setup

```bash
# Start webhook listener
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
```

### Environment Variables

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Important:** The webhook secret from `stripe listen` output must match the `.env` value.

## Error Handling

### Missing Signature

```typescript
if (!signature) {
  throw new BadRequestException('Missing stripe-signature header');
}
```

### Invalid Signature

```typescript
try {
  const event = this.stripeService.verifyWebhookSignature(rawBody, signature);
} catch (error) {
  throw new BadRequestException('Webhook verification failed');
}
```

### Missing Checkout Session ID

```typescript
if (!checkoutSessionId) {
  this.logger.warn(`No checkout_session_id in payment intent metadata`);
  return; // Skip processing, don't throw
}
```

## Raw Body Handling

NestJS requires raw body for webhook signature verification:

**In `main.ts`:**
```typescript
app.useGlobalPipes(new ValidationPipe({ ... }));
// Raw body parser for webhooks
app.use('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }));
```

**Controller access:**
```typescript
@Req() request: RawBodyRequest<Request>
// ...
const rawBody = request.rawBody;
```

## Integration with Checkout

The webhook completes the checkout flow:

```
User → Checkout → Payment Intent Created → Stripe
                                             ↓
Stripe → Webhook → payment_intent.succeeded
                                             ↓
                        completeCheckout() → Order Created
```

## Testing

### Unit Tests

```bash
npm test -- src/modules/webhooks
```

### Manual Testing

```bash
# Test webhook endpoint directly
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded", ...}'
```

### Stripe CLI Testing

```bash
# Trigger specific events
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
stripe trigger charge.refunded
```

## Production Setup

### Stripe Dashboard Configuration

1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://smarket.sh3.su/api/v1/webhooks/stripe`
3. Select events to listen for
4. Copy signing secret to production `.env`

### Security Checklist

- [ ] Webhook endpoint is public (@Public decorator)
- [ ] Signature verification enabled
- [ ] Production webhook secret set
- [ ] HTTPS enforced (production)
- [ ] Rate limiting configured

## TODO Items

Current unimplemented handlers:

```typescript
// handlePaymentFailed()
// TODO: Mark checkout session as failed
// TODO: Notify user about payment failure

// handlePaymentCanceled()
// TODO: Cancel checkout session
// TODO: Release inventory reservations

// handleChargeRefunded()
// TODO: Update order status to REFUNDED
// TODO: Notify merchant and customer
```

## Related Documentation

- See `development/stripe-setup.md` for Stripe CLI setup
- See `modules/checkout.md` for checkout flow
- See `modules/payment.md` for payment processing
- See `integration/checkout-to-order.md` for order creation flow
