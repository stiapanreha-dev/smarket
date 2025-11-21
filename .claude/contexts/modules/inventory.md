# Inventory Module

Stock management and reservations for physical products.

## Purpose

Manages product inventory, stock levels, and temporary reservations during checkout.

## Key Features

- Real-time stock tracking
- Inventory reservations (during checkout)
- Stock alerts and notifications
- Multi-warehouse support (future)
- Stock adjustments and auditing

## Inventory Reservation Flow

1. **Checkout Initiated** - Stock reserved for checkout session (30 min)
2. **Payment Confirmed** - Reservation converted to permanent allocation
3. **Reservation Expired** - Stock returned if checkout abandoned

## Stock Operations

```typescript
// Check availability
const isAvailable = await this.inventoryService.checkAvailability(
  productId,
  quantity
);

// Reserve stock (during checkout)
await this.inventoryService.reserveStock(
  productId,
  quantity,
  checkoutSessionId,
  expiresAt
);

// Release reservation (on payment success/failure)
await this.inventoryService.releaseReservation(checkoutSessionId);

// Deduct stock (after order confirmed)
await this.inventoryService.deductStock(productId, quantity);
```

## Concurrency Handling

Uses database-level locking to prevent overselling:

```typescript
// Pessimistic locking
await this.dataSource.transaction(async (manager) => {
  const inventory = await manager.findOne(Inventory, {
    where: { product_id: productId },
    lock: { mode: 'pessimistic_write' },
  });

  if (inventory.available < quantity) {
    throw new InsufficientStockError();
  }

  inventory.available -= quantity;
  await manager.save(inventory);
});
```

## Stock Alerts

Automatically notify merchants when stock levels are low.

## Integration Points

- **Catalog Module**: Product stock display
- **Checkout Module**: Stock reservation during checkout
- **Orders Module**: Stock deduction after payment
- **Notification Module**: Low stock alerts

## Related

- See `modules/catalog.md` for product types
- See `modules/checkout.md` for reservation flow
- See `modules/orders.md` for stock deduction
