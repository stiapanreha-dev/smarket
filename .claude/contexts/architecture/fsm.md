# FSM-Based Order Management

The Orders module implements Finite State Machines for three product types.

## Physical Items Flow

```
PENDING → PAYMENT_CONFIRMED → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED
         ↓                    ↓           ↓
         CANCELLED            CANCELLED   CANCELLED
```

## Digital Items Flow

```
PENDING → PAYMENT_CONFIRMED → ACCESS_GRANTED → DOWNLOADED
         ↓                    ↓
         CANCELLED            REFUND_REQUESTED → REFUNDED
```

## Service Items Flow

```
PENDING → PAYMENT_CONFIRMED → BOOKING_CONFIRMED → REMINDER_SENT → IN_PROGRESS → COMPLETED
         ↓                    ↓                   ↓                ↓
         CANCELLED            CANCELLED           CANCELLED        NO_SHOW
```

## State Transition Rules

State transitions are:
- Validated by `OrderFSMService`
- Logged in `order_status_transitions` table for audit trail
- Emit events to outbox for reliable processing

## Implementation Pattern

```typescript
// Validate transition
const canTransition = await this.orderFSMService.canTransition(
  order,
  newStatus
);

if (!canTransition) {
  throw new BadRequestException('Invalid state transition');
}

// Apply transition
await this.orderFSMService.transition(order, newStatus, {
  actor_id: userId,
  notes: 'Payment confirmed',
});
```

## Key Rules

1. **Always use OrderFSMService** - Never update order status directly
2. **Validate transitions** - Use `canTransition()` before applying
3. **Log transitions** - Automatic logging in `order_status_transitions`
4. **Emit events** - FSM triggers outbox events automatically

## Related Documentation

See `/src/modules/orders/README.md` for detailed FSM implementation.
