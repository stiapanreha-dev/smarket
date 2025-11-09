# Payment Service Module

Multi-provider payment system with split payments support for marketplace platform.

## Features

- **Multi-Provider Support**: Stripe, YooKassa, Network International
- **Split Payments**: Automatic payment distribution between merchants
- **Authorize & Capture**: Two-phase payment flow
- **Refunds**: Full and partial refund support
- **Webhook Handling**: Automatic payment status synchronization
- **Idempotency**: Prevents duplicate payments
- **Event Integration**: Seamless integration with Order FSM

## Architecture

### Payment Flow

```
1. AUTHORIZE
   ↓
2. PAYMENT_CONFIRMED
   ↓
3. CAPTURE (triggered by order status)
   ↓
4. SPLITS_DISTRIBUTED
   ↓
5. ESCROW → PAYOUT
```

### Components

- **Providers**: Payment gateway adapters (Stripe, YooKassa, Network Intl)
- **Services**: Business logic (authorization, capture, refunds, splits)
- **Controllers**: REST API endpoints
- **Handlers**: Event-driven payment capture
- **Entities**: Database models (Payment, PaymentSplit, Refund)

## Provider Selection

Provider is automatically selected based on currency:

- **RUB** → YooKassa (with fiscalization)
- **AED** → Network International
- **USD, EUR, etc.** → Stripe

## Split Payment Calculation

Platform fees vary by product type:

- **Physical items**: 15%
- **Digital items**: 20%
- **Services**: 10%

Processing fee: 2.9% + 30¢

### Example Calculation

```typescript
Order Total: $100
Items:
  - Physical item: $60 (Merchant A)
  - Digital item: $40 (Merchant B)

Split for Merchant A:
  Gross: $60
  Platform Fee: $9 (15%)
  Processing Fee: $2.04 (2.9% + $0.30)
  Net: $48.96

Split for Merchant B:
  Gross: $40
  Platform Fee: $8 (20%)
  Processing Fee: $1.46 (2.9% + $0.30)
  Net: $30.54

Total Platform Revenue: $17 + $3.50 = $20.50
```

## API Endpoints

### Authorize Payment
```http
POST /api/v1/payments/authorize
Authorization: Bearer {token}

{
  "orderId": "uuid",
  "idempotencyKey": "optional-key"
}
```

### Capture Payment
```http
POST /api/v1/payments/:id/capture
Authorization: Bearer {token}
```

### Refund Payment
```http
POST /api/v1/payments/:id/refund
Authorization: Bearer {token}

{
  "amount": 5000,
  "reason": "Customer requested",
  "lineItemId": "uuid" // optional for partial refunds
}
```

### Get Payment
```http
GET /api/v1/payments/:id
Authorization: Bearer {token}
```

### Get Payment by Order
```http
GET /api/v1/payments/order/:orderId
Authorization: Bearer {token}
```

## Webhooks

### Stripe
```http
POST /api/v1/webhooks/stripe
Headers:
  stripe-signature: {signature}
```

### YooKassa
```http
POST /api/v1/webhooks/yookassa
Headers:
  authorization: {auth}
```

### Network International
```http
POST /api/v1/webhooks/network-intl
Headers:
  x-signature: {signature}
```

## Event Integration

### Listening to Events

Payment service listens to:

- `order.confirmed` - Capture payment for digital items
- `line_item.status_changed` - Capture payment when item is being fulfilled
- `line_item.refund_requested` - Process refunds

### Emitting Events

Payment service emits:

- `payment.authorized` - Payment authorized successfully
- `payment.captured` - Payment captured
- `payment.refunded` - Refund processed

## Database Schema

### payments
- id, order_id, provider, status
- amount_minor, currency
- authorized_amount, captured_amount, refunded_amount
- platform_fee, idempotency_key
- requires_action, action_url

### payment_splits
- id, payment_id, merchant_id
- gross_amount, platform_fee, processing_fee, net_amount
- status, escrow_release_date, payout_id

### refunds
- id, payment_id, order_line_item_id
- amount_minor, currency, status, reason
- provider_refund_id

### webhook_events
- id, provider, provider_event_id
- event_type, payload, processed

## Configuration

Environment variables:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# YooKassa
YOOKASSA_SHOP_ID=...
YOOKASSA_SECRET_KEY=...

# Network International
NETWORK_INTL_API_KEY=...
NETWORK_INTL_OUTLET_ID=...
NETWORK_INTL_SECRET_KEY=...

# Frontend URL (for payment redirects)
FRONTEND_URL=https://yoursite.com
```

## Idempotency

All payment operations use idempotency keys to prevent duplicates:

- Key format: `payment_{orderId}_{timestamp}`
- Duplicate requests return existing payment
- Safe for retries

## Error Handling

Payment errors are categorized:

- `PaymentProviderError` - Provider-specific errors
- `BadRequestException` - Invalid request (e.g., wrong status)
- `NotFoundException` - Payment not found
- `ConflictException` - Duplicate payment attempt

## Security

- ✅ Webhook signature verification
- ✅ Idempotency protection
- ✅ PCI compliance (no card data stored)
- ✅ Environment-based configuration
- ✅ Rate limiting (via NestJS Throttler)

## Testing

```bash
# Unit tests
npm test -- payment

# E2E tests
npm run test:e2e -- payment

# Test webhook locally
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: test" \
  -H "Content-Type: application/json" \
  -d '{"type": "payment_intent.succeeded", "data": {...}}'
```

## Migration

Run payment migrations:

```bash
npm run migration:run
```

This creates:
- payments table
- payment_splits table
- refunds table
- webhook_events table

## Future Enhancements

- [ ] Payout scheduling (weekly/monthly)
- [ ] Merchant dashboard for payment history
- [ ] Dispute management
- [ ] Recurring payments
- [ ] 3D Secure enforcement
- [ ] Multi-currency support improvements
- [ ] Payment analytics dashboard
