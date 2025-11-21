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
