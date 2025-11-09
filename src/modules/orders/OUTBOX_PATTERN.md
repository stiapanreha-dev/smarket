# Outbox Pattern Implementation

## Overview

This implementation provides a robust, exactly-once delivery guarantee for domain events using the Outbox Pattern. Events are stored in the database as part of the same transaction as the business operation, then processed asynchronously by a background worker.

## Architecture

```
┌─────────────────────┐
│  Business Logic     │
│  (OrderService)     │
└──────────┬──────────┘
           │
           │ Transaction
           ▼
┌─────────────────────────────────────────┐
│  Database Transaction                   │
│  ┌─────────────┐    ┌──────────────┐  │
│  │   Orders    │    │    Outbox    │  │
│  │   Table     │    │    Table     │  │
│  └─────────────┘    └──────────────┘  │
└─────────────────────────────────────────┘
           │
           │ Async Processing
           ▼
┌─────────────────────┐
│  OutboxProcessor    │
│  (Cron: every 10s)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  EventEmitter       │
│  (EventHandlers)    │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│  Side Effects                        │
│  • Email notifications               │
│  • Search index updates              │
│  • Analytics tracking                │
│  • Warehouse notifications           │
└──────────────────────────────────────┘
```

## Key Features

### 1. Exactly-Once Delivery
- Events are stored in the database within the same transaction as business operations
- No events are lost even if the application crashes
- Idempotency keys prevent duplicate event processing

### 2. Automatic Retry with Exponential Backoff
- Failed events are automatically retried up to 5 times
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 5 minutes)
- Jitter added to prevent thundering herd problem

### 3. Dead Letter Queue (DLQ)
- Events failing all retry attempts are moved to DLQ
- DLQ entries can be manually reprocessed
- Full audit trail preserved

### 4. Comprehensive Monitoring
- Real-time metrics via `/outbox/metrics` endpoint
- Health check endpoint: `/outbox/health`
- Automatic alerting for:
  - High outbox lag (>5 minutes)
  - Large DLQ size (>100 events)
  - High retry rate (>50%)

## Database Schema

### Outbox Table
```sql
CREATE TABLE order_outbox (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  next_retry_at TIMESTAMP,
  idempotency_key VARCHAR(255) UNIQUE
);
```

### DLQ Table
```sql
CREATE TABLE order_outbox_dlq (
  id UUID PRIMARY KEY,
  original_event_id UUID NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL,
  first_failed_at TIMESTAMP NOT NULL,
  moved_to_dlq_at TIMESTAMP DEFAULT NOW(),
  reprocessed BOOLEAN DEFAULT FALSE,
  reprocessed_at TIMESTAMP
);
```

## Usage

### Adding Events in Business Logic

```typescript
import { OutboxService } from './services/outbox.service';
import { AggregateType } from '../entities/order-outbox.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly outboxService: OutboxService,
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(orderData: CreateOrderDto): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Create order
      const order = await manager.save(Order, orderData);

      // 2. Add event to outbox (same transaction!)
      await this.outboxService.addEvent(
        {
          aggregateId: order.id,
          aggregateType: AggregateType.ORDER,
          eventType: 'OrderCreated',
          payload: {
            orderId: order.id,
            orderNumber: order.order_number,
            totalAmount: order.total_amount,
            userId: order.user_id,
          },
          idempotencyKey: `order-created-${order.id}`, // Optional
        },
        manager, // Pass transaction manager
      );

      return order;
    });
  }
}
```

### Creating Event Handlers

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '../events/order-events';

@Injectable()
export class OrderCreatedHandler {
  private readonly logger = new Logger(OrderCreatedHandler.name);

  @OnEvent('OrderCreated')
  async handle(event: OrderCreatedEvent): Promise<void> {
    this.logger.log(`Handling OrderCreated: ${event.payload.orderNumber}`);

    // Execute side effects
    await this.sendEmail(event);
    await this.updateSearchIndex(event);
    await this.trackAnalytics(event);

    // If any side effect fails, the error will be caught
    // and the event will be retried automatically
  }

  private async sendEmail(event: OrderCreatedEvent): Promise<void> {
    // Email sending logic
  }
}
```

## API Endpoints

### Get Metrics
```bash
GET /outbox/metrics

Response:
{
  "pending": 5,
  "processing": 1,
  "processed": 1234,
  "failed": 2,
  "dlqSize": 0,
  "avgProcessingTime": 123.45,
  "retryRate": 5.2,
  "outboxLag": 1234.56
}
```

### Health Check
```bash
GET /outbox/health

Response:
{
  "status": "healthy",
  "metrics": { ... },
  "alerts": []
}
```

### Manual Processing Trigger
```bash
POST /outbox/process

Response:
{
  "message": "Outbox processing triggered"
}
```

### Reprocess from DLQ
```bash
POST /outbox/dlq/:id/reprocess

Response:
{
  "message": "Event {id} moved from DLQ to outbox for reprocessing"
}
```

## Configuration

### Retry Settings
```typescript
// In OutboxService
private readonly MAX_RETRIES = 5;
private readonly INITIAL_BACKOFF_MS = 1000; // 1 second
private readonly MAX_BACKOFF_MS = 300000; // 5 minutes
```

### Processing Schedule
```typescript
// In OutboxProcessorService
@Cron('*/10 * * * * *')  // Every 10 seconds
async processEvents() { ... }

@Cron(CronExpression.EVERY_DAY_AT_3AM)  // Daily cleanup
async cleanupProcessedEvents() { ... }

@Cron(CronExpression.EVERY_MINUTE)  // Metrics logging
async logMetrics() { ... }
```

## Monitoring Best Practices

### Key Metrics to Track

1. **Outbox Lag**: Time between event creation and processing
   - Target: <1 minute
   - Alert: >5 minutes

2. **DLQ Size**: Number of permanently failed events
   - Target: 0
   - Alert: >100 events

3. **Retry Rate**: Percentage of events requiring retries
   - Target: <10%
   - Alert: >50%

4. **Processing Throughput**: Events processed per minute
   - Monitor trends
   - Scale if consistently high

### Alerting Setup

```bash
# Prometheus metrics (example)
outbox_pending_total
outbox_failed_total
outbox_dlq_size
outbox_lag_seconds
outbox_retry_rate_percent
outbox_processing_duration_seconds
```

## Troubleshooting

### High Outbox Lag
1. Check processor is running: Look for cron job logs
2. Increase processing frequency if needed
3. Check database performance (locks, slow queries)
4. Scale horizontally if single processor can't keep up

### High Retry Rate
1. Check handler logs for common error patterns
2. Identify and fix root cause in handlers
3. Consider circuit breakers for external services
4. Implement better error handling

### Large DLQ
1. Review DLQ entries: `SELECT * FROM order_outbox_dlq ORDER BY moved_to_dlq_at DESC`
2. Identify common failure patterns
3. Fix underlying issues
4. Reprocess fixed events: `POST /outbox/dlq/{id}/reprocess`

## Performance Considerations

### Database Optimization
- Indexes on `status` and `next_retry_at` for fast pending event lookup
- Regular cleanup of old processed events (default: 30 days)
- Consider partitioning outbox table by date for high-volume systems

### Scaling
- Single processor handles ~1000 events/minute
- For higher throughput, consider:
  - Increasing processing frequency
  - Horizontal scaling with distributed locks
  - Sharding by aggregate type

## Event Types

Currently supported event types:
- `OrderCreated`: New order created
- `OrderConfirmed`: Order confirmed after payment
- `PaymentProcessed`: Payment successfully processed
- `OrderCompleted`: Order fulfillment completed
- `OrderCancelled`: Order cancelled

## Migration Guide

To apply the outbox pattern:

```bash
# Run migration
npm run migration:run

# Verify tables created
psql -d snailmarket -c "\dt order_outbox*"
```

## References

- [Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Exactly-Once Delivery](https://www.confluent.io/blog/exactly-once-semantics-are-possible-heres-how-apache-kafka-does-it/)
