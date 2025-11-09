# Checkout Module

Multi-step checkout process implementation for SnailMarket e-commerce platform.

## Features

### Multi-Step Flow
1. **Cart Review** - Snapshot cart with locked prices
2. **Shipping Address** - For physical items (optional for digital/services)
3. **Payment Method** - Select payment method
4. **Order Review** - Final review before payment
5. **Payment** - Process payment
6. **Confirmation** - Order created

### Business Logic

#### Session Management
- **TTL**: 30 minutes
- **Automatic cleanup**: Cron job runs hourly
- **Inventory reservation**: 15 minutes TTL with automatic release

#### Totals Calculation
```typescript
{
  subtotal: number;        // Sum of items
  tax_amount: number;      // VAT/taxes based on address
  shipping_amount: number; // Delivery cost
  discount_amount: number; // Promo codes
  total_amount: number;    // Final total
  currency: string;
}
```

#### Tax Calculation
- Cached by region (24h TTL)
- Supports country/state-level rates
- Integrates with tax service APIs (Avalara, TaxJar)

#### Shipping Calculation
- Based on destination and item count
- International vs domestic rates
- Carrier API integration ready

#### Promo Codes
- Percentage or fixed amount discounts
- Minimum purchase requirements
- Usage limits and expiration
- Maximum discount caps

### Inventory Management

#### Reservation System
- **Pessimistic locking** during checkout
- **Redis-based TTL** (15 minutes)
- **Automatic release** on expiry/cancellation
- **Atomic commitment** on order completion

#### Booking Slots
- Service appointments with time slots
- Capacity management
- Concurrent reservation handling

### Payment Processing

#### Supported Methods
- Card payments
- Apple Pay / Google Pay
- Bank transfer
- PayPal
- Cryptocurrency
- Cash on delivery

#### Saga Pattern
Transaction management with rollback capability:
1. Create order
2. Process payment
3. Commit inventory
4. Clear cart
5. Send confirmation

On failure: automatic rollback and inventory release.

### Edge Cases

#### Session Expiry
- Automatic status update to `expired`
- Inventory reservation release
- User notification

#### Payment Failure
- Saga rollback
- Error message capture
- Retry capability

#### Insufficient Inventory
- Session creation fails
- Clear error message
- Alternative suggestions

#### Duplicate Orders
- Idempotency key support
- Returns existing order for duplicate requests

## API Endpoints

### Create Checkout Session
```http
POST /api/v1/checkout/sessions
Content-Type: application/json

{
  "sessionId": "guest-session-123",  // Optional for guest
  "metadata": {
    "device": "web",
    "referrer": "https://example.com"
  }
}
```

### Get Session
```http
GET /api/v1/checkout/sessions/:id
```

### Update Shipping Address
```http
PUT /api/v1/checkout/sessions/:id/shipping
Content-Type: application/json

{
  "country": "US",
  "state": "CA",
  "city": "San Francisco",
  "street": "123 Market St",
  "postal_code": "94103",
  "phone": "+14155551234",
  "first_name": "John",
  "last_name": "Doe",
  "use_as_billing": true
}
```

### Update Payment Method
```http
PUT /api/v1/checkout/sessions/:id/payment-method
Content-Type: application/json

{
  "payment_method": "card",
  "payment_details": {
    "token": "tok_visa",
    "last4": "4242"
  }
}
```

### Apply Promo Code
```http
POST /api/v1/checkout/sessions/:id/apply-promo
Content-Type: application/json

{
  "code": "SAVE10"
}
```

### Complete Checkout
```http
POST /api/v1/checkout/sessions/:id/complete
Content-Type: application/json

{
  "idempotency_key": "unique-order-key-123"
}
```

### Cancel Session
```http
DELETE /api/v1/checkout/sessions/:id
```

## Database Schema

### checkout_sessions Table
```sql
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id VARCHAR(255),
  cart_snapshot JSONB NOT NULL,
  step checkout_step DEFAULT 'cart_review',
  shipping_address JSONB,
  billing_address JSONB,
  payment_method payment_method_type,
  payment_details JSONB,
  totals JSONB NOT NULL,
  promo_codes JSONB,
  status checkout_status DEFAULT 'in_progress',
  idempotency_key VARCHAR(255) UNIQUE,
  order_id UUID,
  error_message TEXT,
  metadata JSONB,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Indexes
- `(user_id, status)` - User's active sessions
- `(session_id)` - Guest checkout lookup
- `(status, expires_at)` - Cleanup job
- `(created_at)` - Historical queries
- Partial index on `(user_id, created_at) WHERE status = 'in_progress'`

## Performance Optimizations

### Caching
- Tax rates by region (24h)
- Shipping rates
- Promo code validation

### Batching
- Inventory checks
- Booking slot validation

### Async Operations
- Email sending
- Analytics events
- Inventory release

## Testing

### Unit Tests
```bash
npm test -- checkout.service.spec
```

### E2E Tests
```bash
npm run test:e2e -- checkout.e2e-spec
```

### Test Coverage
- Happy path flow
- Guest checkout
- Session expiry
- Payment failure + rollback
- Insufficient inventory
- Invalid promo codes
- Idempotency

## Future Enhancements

1. **Split Payments** - Multiple payment methods
2. **Partial Fulfillment** - Split delivery
3. **Subscription Support** - Recurring orders
4. **Gift Cards** - Balance application
5. **Buy Now Pay Later** - Klarna, Afterpay
6. **Address Validation** - Google Places API
7. **Fraud Detection** - Risk scoring
8. **Analytics** - Conversion tracking

## Dependencies

- `@nestjs/schedule` - Cron jobs
- `typeorm` - Database ORM
- `ioredis` - Redis cache
- Cart Module - Cart data
- Inventory Module - Stock management
- Payment Module - Payment processing
- Notification Module - Email/SMS

## Migration

Run migration to create tables:
```bash
npm run migration:run
```

Rollback:
```bash
npm run migration:revert
```
