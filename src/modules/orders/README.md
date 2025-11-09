# Orders Module - FSM-based Order Management System

## Overview

This module implements a comprehensive order management system with Finite State Machine (FSM) for managing different product types (physical, digital, service items).

## Architecture

### Components

1. **Entities**
   - `Order` - Order header with customer and payment info
   - `OrderLineItem` - Individual items with FSM state
   - `OrderStatusTransition` - Audit trail for status changes
   - `OrderOutbox` - Event outbox for async processing

2. **Services**
   - `OrderService` - Main order operations (create, update, cancel)
   - `OrderFSMService` - FSM transitions with validation
   - `OutboxService` - Event publishing and processing

3. **Controllers**
   - `OrderController` - Customer-facing API
   - `MerchantOrderController` - Merchant fulfillment API

## FSM State Machines

### Physical Items
```
PENDING → PAYMENT_CONFIRMED → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED
         ↓                    ↓           ↓
         CANCELLED            CANCELLED   CANCELLED

DELIVERED → REFUND_REQUESTED → REFUNDED
```

**Cancellable until:** `READY_TO_SHIP`
**Refundable:** Within 14 days of delivery

### Digital Items
```
PENDING → PAYMENT_CONFIRMED → ACCESS_GRANTED → DOWNLOADED
         ↓                    ↓
         CANCELLED            REFUND_REQUESTED → REFUNDED
```

**Refundable:**
- Instant refund before first download
- Within 7 days after access granted

### Service Items
```
PENDING → PAYMENT_CONFIRMED → BOOKING_CONFIRMED → REMINDER_SENT → IN_PROGRESS → COMPLETED
         ↓                    ↓                   ↓                ↓
         CANCELLED            CANCELLED           CANCELLED        NO_SHOW

COMPLETED/NO_SHOW → REFUND_REQUESTED → REFUNDED
```

**Cancellable:** Up to 24h before appointment
**Refundable:** Policy-based

## API Endpoints

### Customer API

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>

{
  "checkout_session_id": "uuid",
  "payment_intent_id": "pi_xxx" (optional)
}
```

#### List Orders
```http
GET /api/v1/orders?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Get Order
```http
GET /api/v1/orders/:orderNumber
Authorization: Bearer <token>
```

#### Track Order (Public)
```http
GET /api/v1/orders/:orderNumber/track?email=customer@example.com
```

#### Cancel Order
```http
POST /api/v1/orders/:orderId/cancel
Authorization: Bearer <token>

{
  "reason": "Customer requested cancellation"
}
```

### Merchant API

#### Get Merchant Orders
```http
GET /api/v1/merchant/orders
Authorization: Bearer <token>
```

#### Get Order Items
```http
GET /api/v1/merchant/orders/:orderId/items
Authorization: Bearer <token>
```

#### Update Line Item Status
```http
POST /api/v1/merchant/orders/:orderId/items/:itemId/transition
Authorization: Bearer <token>

{
  "to_status": "preparing",
  "reason": "Started preparing order",
  "metadata": {}
}
```

#### Mark Item as Fulfilled
```http
POST /api/v1/merchant/orders/:orderId/items/:itemId/fulfill
Authorization: Bearer <token>
```

#### Ship Item
```http
POST /api/v1/merchant/orders/:orderId/items/:itemId/ship
Authorization: Bearer <token>

{
  "tracking_number": "1Z999AA10123456784",
  "carrier": "UPS",
  "estimated_delivery": "2024-02-20T00:00:00Z"
}
```

## Usage Examples

### Creating an Order

```typescript
// 1. User completes checkout
const checkoutSession = await checkoutService.createSession(userId, {
  sessionId: 'cart-session-id',
});

// 2. User proceeds through checkout steps
await checkoutService.updateShippingAddress(checkoutSession.id, address);
await checkoutService.updatePaymentMethod(checkoutSession.id, paymentMethod);

// 3. Payment is processed
const paymentIntent = await paymentService.createPayment(checkoutSession);

// 4. Order is created
const order = await orderService.createOrderFromCheckout(
  checkoutSession.id,
  paymentIntent.id,
);

// 5. Payment is confirmed
await orderService.confirmPayment(order.id);
// This transitions all line items to 'payment_confirmed'
```

### Merchant Fulfillment Flow

```typescript
// 1. Merchant views new orders
const orders = await merchantOrderService.getOrders(merchantId);

// 2. Start preparing physical item
await orderService.updateLineItemStatus(
  orderId,
  lineItemId,
  'preparing',
  { reason: 'Started preparing', user_id: merchantId },
);

// 3. Mark as ready to ship
await orderService.updateLineItemStatus(
  orderId,
  lineItemId,
  'ready_to_ship',
);

// 4. Ship item with tracking
await orderService.updateLineItemStatus(
  orderId,
  lineItemId,
  'shipped',
  {
    tracking_number: '1Z999AA10123456784',
    carrier: 'UPS',
    estimated_delivery: new Date('2024-02-20'),
  },
);
```

### FSM Validation

```typescript
// Check if transition is allowed
const canTransition = fsmService.canTransition(
  LineItemType.PHYSICAL,
  'preparing',
  'shipped',
);
// Returns: false (must go through ready_to_ship first)

// Get allowed transitions
const allowed = fsmService.getAllowedTransitions(
  LineItemType.PHYSICAL,
  'preparing',
);
// Returns: ['ready_to_ship', 'cancelled']

// Check refund eligibility
const refundCheck = fsmService.canRefund(lineItem);
// Returns: { allowed: boolean, reason?: string }
```

## Event-Driven Architecture

All state changes emit events through the Outbox pattern:

### Events

- `order.created` - New order created
- `order.payment_confirmed` - Payment captured
- `order.status_changed` - Order status updated
- `order.cancelled` - Order cancelled
- `line_item.status_changed` - Line item status changed

### Outbox Processing

```typescript
// Background job (e.g., via cron)
@Cron(CronExpression.EVERY_10_SECONDS)
async processOutboxEvents() {
  await outboxService.processEvents();
}

// Or manually trigger
await outboxService.processEvents();
```

## Testing

### Run Unit Tests
```bash
npm test src/modules/orders/services/__tests__/order-fsm.service.spec.ts
```

### Run Integration Tests
```bash
npm run test:e2e test/orders.e2e-spec.ts
```

## Database Schema

See migration: `1699000000009-CreateOrders.ts`

### Key Tables

- `orders` - Order header
- `order_line_items` - Items with FSM state
- `order_status_transitions` - Audit trail
- `order_outbox` - Event outbox

### Indexes

- Orders: `user_id`, `status`, `order_number`, `created_at`
- Line Items: `order_id`, `merchant_id`, `status`, `type`
- Transitions: `order_id`, `line_item_id`, `created_at`
- Outbox: `status`, `aggregate_type`, `event_type`

## Side Effects

FSM transitions can trigger side effects:

### Physical Items
- `payment_confirmed` → Confirm inventory reservation
- `shipped` → Send shipment notification
- `delivered` → Request review after 24h
- `cancelled` → Release inventory

### Digital Items
- `access_granted` → Generate download link, send email
- `cancelled/refunded` → Revoke access

### Service Items
- `booking_confirmed` → Confirm booking slot
- `reminder_sent` → Send reminder notification
- `cancelled` → Release booking slot

## Security

- Order access verified by user_id
- Merchant access verified by merchant_id on line items
- Guest orders require email verification
- All transitions logged in audit table

## Performance Considerations

- Line item transitions use pessimistic locking
- Outbox processing is batched (100 events at a time)
- Indexes on all foreign keys and status fields
- Partitioning recommended for high-volume orders

## Future Enhancements

- [ ] Split payments across merchants
- [ ] Partial cancellations
- [ ] Return management
- [ ] Order modifications
- [ ] Subscription support
- [ ] Backorder handling
