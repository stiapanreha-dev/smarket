# Orders Module

FSM-based order processing for physical, digital, and service products.

## FSM State Machines

The Orders module implements separate FSM flows for each product type.

### Physical Items Flow
```
PENDING → PAYMENT_CONFIRMED → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED
         ↓                    ↓           ↓
         CANCELLED            CANCELLED   CANCELLED
```

### Digital Items Flow
```
PENDING → PAYMENT_CONFIRMED → ACCESS_GRANTED → DOWNLOADED
         ↓                    ↓
         CANCELLED            REFUND_REQUESTED → REFUNDED
```

### Service Items Flow
```
PENDING → PAYMENT_CONFIRMED → BOOKING_CONFIRMED → REMINDER_SENT → IN_PROGRESS → COMPLETED
         ↓                    ↓                   ↓                ↓
         CANCELLED            CANCELLED           CANCELLED        NO_SHOW
```

## OrderFSMService

**Always use OrderFSMService for state transitions** - never update order status directly.

```typescript
// Validate transition
const canTransition = await this.orderFSMService.canTransition(
  order,
  OrderStatus.PAYMENT_CONFIRMED
);

if (!canTransition) {
  throw new BadRequestException('Invalid state transition');
}

// Apply transition
await this.orderFSMService.transition(order, OrderStatus.PAYMENT_CONFIRMED, {
  actor_id: userId,
  notes: 'Payment confirmed via Stripe',
});
```

## Transition Logging

All transitions are logged in `order_status_transitions` table:
- Previous status
- New status
- Actor (user/system who triggered)
- Timestamp
- Notes

This creates a complete audit trail.

## Event Emission

FSM transitions emit events to outbox:
- `order.status_changed`
- `line_item.status_changed`

These trigger notifications, inventory updates, etc.

## Integration with Checkout Module

**IMPORTANT**: OrderService is called by CheckoutService to create orders from completed checkout sessions.

### createOrderFromCheckout()

Primary method for creating orders from checkout:

```typescript
async createOrderFromCheckout(
  checkoutSessionId: string,
  paymentIntentId?: string
): Promise<Order>
```

### Order Creation Process

1. **Load Checkout Session** - Retrieve session with cart snapshot and totals
2. **Validate Session** - Ensure session is ready for order creation
3. **Start Transaction** - Begin database transaction
4. **Create Order** - Generate order number, create order entity with totals
5. **Create Line Items** - Convert cart snapshot to order line items with product types
6. **Set FSM States** - Initialize all line items to PENDING status
7. **Log Initial Transition** - Record order creation in transitions table
8. **Write Outbox Event** - Emit `order.created` event
9. **Commit Transaction** - Persist all changes atomically

### Transaction Isolation

OrderService uses its own transaction, separate from CheckoutService:
- Ensures atomic order creation regardless of caller
- Allows OrderService to be reused by other modules
- If order creation fails, CheckoutService can rollback its own transaction

### Error Handling

```typescript
try {
  const order = await orderService.createOrderFromCheckout(sessionId, paymentIntentId);
} catch (error) {
  // Order creation failed - cart snapshot invalid, missing data, etc.
  // CheckoutService will handle rollback and cleanup
  throw new BadRequestException(`Order creation failed: ${error.message}`);
}
```

Common failures:
- Cart snapshot empty or invalid
- Missing required shipping address for physical products
- Product pricing mismatch
- Database constraint violations

### Payment Intent Association

If `paymentIntentId` is provided, it's stored in the order for payment tracking:

```typescript
order.payment_intent_id = paymentIntentId; // Optional, from payment provider
```

### Order Number Generation

Orders receive unique identifiers:
- **Order Number**: Human-readable format `ORD-YYYY-NNNNN` (e.g., `ORD-2024-00123`)
- **Order ID**: UUID for database references

## Line Items

Orders contain line items (one per product):
- Each line item has its own FSM state
- Order status aggregated from line items
- Mixed product types handled independently

## Key Files

- `order-fsm.service.ts` - FSM logic and validation
- `order.service.ts` - Order business logic
- `order.controller.ts` - Order API endpoints
- `order.entity.ts` - Order entity
- `order-line-item.entity.ts` - Line item entity

## Detailed Documentation

See `/src/modules/orders/README.md` for comprehensive FSM documentation.

See `/src/modules/orders/OUTBOX_PATTERN.md` for event handling details.

## Related

- See `architecture/fsm.md` for FSM patterns
- See `architecture/events-outbox.md` for event handling
- See `modules/payment.md` for payment integration
- See `modules/checkout.md` for checkout-to-order integration
- See `integration/checkout-to-order.md` for complete integration flow
