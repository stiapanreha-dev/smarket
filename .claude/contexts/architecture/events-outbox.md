# Event-Driven Architecture with Outbox Pattern

## Outbox Pattern Overview

The system uses the **Outbox pattern** for reliable event publishing, ensuring events are never lost even if external systems fail.

## How It Works

1. **Write Phase**: Business operations write events to `order_outbox` table in the same transaction as the business logic
2. **Poll Phase**: Background job (`OutboxService.processEvents()`) polls outbox and publishes events
3. **Dead Letter Queue**: Successfully published events are moved to `order_outbox_dlq` if they fail multiple times

## Event Types

Events include:
- `order.created` - New order created
- `order.payment_confirmed` - Payment successful
- `order.status_changed` - Order status transition
- `line_item.status_changed` - Line item status change

## Implementation Pattern

```typescript
// In your service
async createOrder(dto: CreateOrderDto): Promise<Order> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Business logic
    const order = await queryRunner.manager.save(Order, orderData);

    // 2. Write event to outbox (same transaction)
    await queryRunner.manager.save(OrderOutbox, {
      event_type: 'order.created',
      aggregate_id: order.id,
      payload: { order_id: order.id, customer_id: order.customer_id },
    });

    await queryRunner.commitTransaction();
    return order;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

## Key Benefits

- **Reliability**: Events are never lost (saved in same transaction)
- **Consistency**: Business logic and events are atomic
- **Resilience**: Failed events go to DLQ for manual inspection
- **Scalability**: Background processing doesn't block business logic

## Outbox Tables

- `order_outbox` - Pending events to be published
- `order_outbox_dlq` - Failed events (dead letter queue)
- `order_status_transitions` - Audit trail for FSM transitions

## Related Documentation

See `/src/modules/orders/OUTBOX_PATTERN.md` for detailed implementation.
