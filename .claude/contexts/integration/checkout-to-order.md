# Checkout-to-Order Integration

Complete documentation of the integration between CheckoutService and OrderService.

## Overview

The checkout-to-order integration implements a **saga pattern** to coordinate the transition from a completed checkout session to a confirmed order. This integration ensures atomicity, proper error handling, and transaction isolation between the two services.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│ CheckoutService │────────▶│  OrderService    │
│   (Saga)        │         │  (Transaction)   │
└─────────────────┘         └──────────────────┘
        │                            │
        ▼                            ▼
┌─────────────────┐         ┌──────────────────┐
│ CheckoutSession │         │     Order        │
│  + cart_snapshot│         │  + line_items    │
│  + totals       │         │  + status        │
└─────────────────┘         └──────────────────┘
```

### Key Principles

1. **Transaction Separation** - Each service manages its own transaction
2. **Saga Pattern** - CheckoutService orchestrates the multi-step process
3. **Error Handling** - Comprehensive rollback and compensation logic
4. **Idempotency** - Operations can be safely retried

## Integration Flow

### Sequence Diagram

```
User          CheckoutService         OrderService        InventoryService      CartService
 │                  │                      │                     │                  │
 │  POST complete   │                      │                     │                  │
 ├─────────────────▶│                      │                     │                  │
 │                  │                      │                     │                  │
 │                  │  1. Load Session    │                     │                  │
 │                  ├─────────────────────▶│                     │                  │
 │                  │                      │                     │                  │
 │                  │  2. Start Txn        │                     │                  │
 │                  ├──────┐               │                     │                  │
 │                  │      │               │                     │                  │
 │                  │◀─────┘               │                     │                  │
 │                  │                      │                     │                  │
 │                  │  3. Create Order     │                     │                  │
 │                  ├─────────────────────▶│                     │                  │
 │                  │                      │  - Generate number  │                  │
 │                  │                      │  - Create entity    │                  │
 │                  │                      │  - Create line items│                  │
 │                  │                      │  - Init FSM states  │                  │
 │                  │                      │  - Write outbox     │                  │
 │                  │◀─────────────────────┤                     │                  │
 │                  │  Order created       │                     │                  │
 │                  │                      │                     │                  │
 │                  │  4. Commit Inventory │                     │                  │
 │                  ├────────────────────────────────────────────▶│                  │
 │                  │◀────────────────────────────────────────────┤                  │
 │                  │                      │                     │                  │
 │                  │  5. Clear Cart       │                     │                  │
 │                  ├─────────────────────────────────────────────────────────────▶│
 │                  │◀─────────────────────────────────────────────────────────────┤
 │                  │                      │                     │                  │
 │                  │  6. Update Session   │                     │                  │
 │                  ├──────┐               │                     │                  │
 │                  │      │               │                     │                  │
 │                  │◀─────┘               │                     │                  │
 │                  │                      │                     │                  │
 │                  │  7. Commit Txn       │                     │                  │
 │                  ├──────┐               │                     │                  │
 │                  │      │               │                     │                  │
 │                  │◀─────┘               │                     │                  │
 │                  │                      │                     │                  │
 │◀─────────────────┤  Response            │                     │                  │
 │  { order_id,     │                      │                     │                  │
 │    order_number} │                      │                     │                  │
```

### Step-by-Step Process

#### Step 1: Validate Session

```typescript
const session = await this.getSession(sessionId, userId);

if (!session) {
  throw new NotFoundException('Checkout session not found');
}

if (session.status === CheckoutStatus.COMPLETED) {
  throw new BadRequestException('Checkout already completed');
}

if (session.is_expired) {
  throw new BadRequestException('Checkout session has expired');
}
```

#### Step 2: Start Transaction

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
```

#### Step 3: Create Order via OrderService

```typescript
try {
  // Extract payment intent ID from JSONB field
  const paymentIntentId = session.payment_details?.paymentIntentId;

  // Call OrderService (uses its own transaction)
  const order = await this.orderService.createOrderFromCheckout(
    session.id,
    paymentIntentId,
  );

  // Store order references
  session.order_id = order.id;
  session.order_number = order.order_number;

  this.logger.log(`Order ${order.order_number} created for session ${session.id}`);
} catch (orderError) {
  this.logger.error(`Failed to create order for session ${session.id}`, orderError);
  throw new BadRequestException(`Order creation failed: ${orderError.message}`);
}
```

**OrderService Transaction (Internal):**

```typescript
// Inside OrderService.createOrderFromCheckout()
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  // 1. Load checkout session
  const session = await this.checkoutSessionRepository.findOne(...);

  // 2. Generate order number
  const orderNumber = await this.generateOrderNumber();

  // 3. Create order entity
  const order = await queryRunner.manager.save(Order, {
    order_number: orderNumber,
    user_id: session.user_id,
    ...session.totals,
    shipping_address: session.shipping_address,
    billing_address: session.billing_address,
    payment_intent_id: paymentIntentId,
  });

  // 4. Create line items from cart snapshot
  const lineItems = await queryRunner.manager.save(
    OrderLineItem,
    session.cart_snapshot.map(item => ({
      order_id: order.id,
      merchant_id: item.merchantId,
      product_id: item.productId,
      type: item.type, // physical, digital, service
      status: 'pending', // Initial FSM state
      quantity: item.quantity,
      unit_price: item.price,
      ...
    }))
  );

  // 5. Write outbox event
  await queryRunner.manager.save(OrderOutbox, {
    event_type: 'order.created',
    aggregate_id: order.id,
    payload: { order_id: order.id, customer_id: order.user_id },
  });

  await queryRunner.commitTransaction();
  return order;
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

#### Step 4: Commit Inventory Reservations

```typescript
try {
  await this.inventoryService.commitReservation(session.id, session.cart_snapshot);
} catch (inventoryError) {
  this.logger.error(
    `Failed to commit inventory for session ${session.id}, order ${order.id}`,
    inventoryError,
  );
  // Order already created - this creates inconsistency
  // In production, would need compensating transaction or manual intervention
  throw new BadRequestException(`Inventory commit failed: ${inventoryError.message}`);
}
```

#### Step 5: Clear Cart (Non-Critical)

```typescript
try {
  await this.clearCart(session);
} catch (cartError) {
  // Non-critical error - log but continue
  this.logger.warn(`Failed to clear cart for session ${session.id}`, cartError);
}
```

#### Step 6: Update Session

```typescript
session.status = CheckoutStatus.COMPLETED;
session.step = CheckoutStep.CONFIRMATION;
session.completed_at = new Date();

await queryRunner.manager.save(session);
```

#### Step 7: Commit Transaction

```typescript
await queryRunner.commitTransaction();

this.logger.log(`Checkout completed for session ${session.id}, order ${order.order_number}`);

// Async: Send confirmation email (don't block response)
this.sendConfirmationEmail(session).catch((err) =>
  this.logger.error('Failed to send confirmation email', err),
);

return session;
```

## Error Handling

### Error Scenarios

#### 1. Order Creation Failure

**Trigger:** OrderService.createOrderFromCheckout() throws error

**Handling:**
```typescript
try {
  order = await this.orderService.createOrderFromCheckout(session.id, paymentIntentId);
} catch (orderError) {
  await queryRunner.rollbackTransaction();

  session.status = CheckoutStatus.FAILED;
  session.error_message = error.message;
  await this.checkoutSessionRepository.save(session);

  await this.inventoryService.releaseReservation(session.id);

  throw new BadRequestException(`Order creation failed: ${orderError.message}`);
}
```

**Outcome:**
- ✅ Checkout transaction rolled back
- ✅ Session marked as FAILED
- ✅ Inventory reservation released
- ✅ No order created

#### 2. Inventory Commit Failure

**Trigger:** InventoryService.commitReservation() throws error

**Handling:**
```typescript
try {
  await this.inventoryService.commitReservation(session.id, session.cart_snapshot);
} catch (inventoryError) {
  await queryRunner.rollbackTransaction();

  // ⚠️ INCONSISTENCY: Order already created by OrderService

  session.status = CheckoutStatus.FAILED;
  await this.checkoutSessionRepository.save(session);

  await this.inventoryService.releaseReservation(session.id);

  throw new BadRequestException(`Inventory commit failed: ${inventoryError.message}`);
}
```

**Outcome:**
- ⚠️ Order exists in database (orphaned)
- ✅ Checkout transaction rolled back
- ✅ Session marked as FAILED
- ✅ Inventory reservation released

**Known Issue:** Requires manual cleanup or compensating transaction to cancel the created order.

#### 3. Cart Clearing Failure

**Trigger:** CartService.clearCart() throws error

**Handling:**
```typescript
try {
  await this.clearCart(session);
} catch (cartError) {
  // Non-critical error - log but continue
  this.logger.warn(`Failed to clear cart for session ${session.id}`, cartError);
}
```

**Outcome:**
- ✅ Checkout completes successfully
- ⚠️ User's cart not cleared (minor UX issue)
- ✅ Order created
- ✅ Session completed

### Error Categorization

**Critical Errors (Fail Fast):**
- Order creation failure
- Inventory commit failure

**Non-Critical Errors (Continue Execution):**
- Cart clearing failure
- Email sending failure

## Transaction Isolation

### Separate Transactions

CheckoutService and OrderService use **separate transactions**:

**CheckoutService Transaction:**
- Manages checkout_sessions table updates
- Coordinates the saga steps
- Handles rollback on failure

**OrderService Transaction:**
- Manages orders and order_line_items tables
- Ensures atomic order creation
- Independent of checkout transaction

### Benefits

1. **Modularity** - OrderService can be called independently
2. **Atomicity** - Order creation is all-or-nothing
3. **Reusability** - OrderService usable by other modules

### Tradeoffs

1. **Inconsistency Risk** - If order succeeds but inventory fails, orphaned order created
2. **Complexity** - Requires compensating transactions for full consistency

## Payment Intent ID Handling

Payment intent IDs are stored in the `payment_details` JSONB field:

```typescript
// In checkout session
payment_details: {
  paymentIntentId: 'pi_stripe_123456',
  last4: '4242',
  brand: 'visa',
}

// Extract for order creation
const paymentIntentId = session.payment_details?.paymentIntentId;

// Pass to OrderService
await this.orderService.createOrderFromCheckout(session.id, paymentIntentId);
```

**If payment_details is null:** `undefined` is passed to OrderService.

## Testing

### Unit Tests

**Location:** `src/modules/checkout/checkout.service.spec.ts`

**Test Coverage:**
- ✅ Successful order creation
- ✅ Payment intent ID extraction
- ✅ Missing payment_details handling
- ✅ Order creation failure and rollback
- ✅ Inventory commit failure handling
- ✅ Cart clearing failure (non-critical)
- ✅ Session not found error
- ✅ Already completed session error

### Integration Tests

**Location:** `test/checkout-order-integration.e2e-spec.ts`

**Test Coverage:**
- ✅ Complete checkout-to-order flow
- ✅ Multiple product types (physical, digital, service)
- ✅ Inventory commitment verification
- ✅ Cart clearing verification
- ✅ Error handling scenarios
- ✅ FSM state transitions
- ✅ Payment intent ID handling

## Future Improvements

### 1. Compensating Transactions

Implement compensating transaction for inventory commit failure:

```typescript
if (inventoryCommitFailed && orderCreated) {
  // Cancel/void the created order
  await this.orderService.cancelOrder(order.id, {
    reason: 'Inventory commit failed',
    automated: true,
  });
}
```

### 2. Two-Phase Commit

Implement distributed transaction protocol for full atomicity:
- Phase 1: Prepare (lock resources)
- Phase 2: Commit (all or nothing)

### 3. Idempotency

Add idempotency keys to prevent duplicate order creation on retry:

```typescript
const idempotencyKey = `checkout-${session.id}`;
const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);

if (existingOrder) {
  return existingOrder; // Already processed
}
```

### 4. Saga Orchestration Library

Consider using a saga library like:
- `@nestjs-steroids/saga`
- Custom saga orchestrator with state machine

## Key Files

**Backend:**
- `src/modules/checkout/checkout.service.ts` - Saga orchestration
- `src/modules/orders/order.service.ts` - Order creation
- `src/modules/checkout/services/inventory-reservation.service.ts` - Inventory management
- `src/modules/cart/cart.service.ts` - Cart operations

**Tests:**
- `src/modules/checkout/checkout.service.spec.ts` - Unit tests
- `test/checkout-order-integration.e2e-spec.ts` - Integration tests

**Frontend:**
- `client/src/store/checkoutStore.ts` - Checkout state management
- `client/src/pages/Checkout/components/OrderReviewStep.tsx` - Final step UI

## Related Documentation

- See `modules/checkout.md` for checkout saga details
- See `modules/orders.md` for order creation details
- See `architecture/fsm.md` for FSM patterns
- See `architecture/events-outbox.md` for event handling
