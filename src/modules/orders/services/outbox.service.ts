import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  OrderOutbox,
  OutboxStatus,
  AggregateType,
} from '../../../database/entities/order-outbox.entity';

export interface OutboxEvent {
  aggregateId: string;
  aggregateType: AggregateType;
  eventType: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OrderOutbox)
    private readonly outboxRepository: Repository<OrderOutbox>,
  ) {}

  /**
   * Add event to outbox (transactional)
   */
  async addEvent(
    event: OutboxEvent,
    manager?: EntityManager,
  ): Promise<OrderOutbox> {
    const repo = manager
      ? manager.getRepository(OrderOutbox)
      : this.outboxRepository;

    const outboxEntry = repo.create({
      aggregate_id: event.aggregateId,
      aggregate_type: event.aggregateType,
      event_type: event.eventType,
      payload: event.payload,
      status: OutboxStatus.PENDING,
      idempotency_key: event.idempotencyKey,
    });

    const saved = await repo.save(outboxEntry);

    this.logger.debug(
      `Event ${event.eventType} added to outbox for ${event.aggregateType}:${event.aggregateId}`,
    );

    return saved;
  }

  /**
   * Get pending events for processing
   */
  async getPendingEvents(limit: number = 100): Promise<OrderOutbox[]> {
    return this.outboxRepository.find({
      where: [
        { status: OutboxStatus.PENDING },
        { status: OutboxStatus.FAILED },
      ],
      order: { created_at: 'ASC' },
      take: limit,
    });
  }

  /**
   * Mark event as processing
   */
  async markProcessing(eventId: string): Promise<void> {
    await this.outboxRepository.update(
      { id: eventId },
      { status: OutboxStatus.PROCESSING },
    );
  }

  /**
   * Mark event as processed
   */
  async markProcessed(eventId: string): Promise<void> {
    await this.outboxRepository.update(
      { id: eventId },
      {
        status: OutboxStatus.PROCESSED,
        processed_at: new Date(),
      },
    );
  }

  /**
   * Mark event as failed
   */
  async markFailed(eventId: string, error: string): Promise<void> {
    const event = await this.outboxRepository.findOne({
      where: { id: eventId },
    });

    if (!event) return;

    await this.outboxRepository.update(
      { id: eventId },
      {
        status: OutboxStatus.FAILED,
        retry_count: event.retry_count + 1,
        error_message: error,
      },
    );
  }

  /**
   * Process all pending events
   * This should be called by a background job/scheduler
   */
  async processEvents(): Promise<void> {
    const events = await this.getPendingEvents();

    for (const event of events) {
      try {
        await this.markProcessing(event.id);

        // Emit event to event bus or message queue
        await this.publishEvent(event);

        await this.markProcessed(event.id);

        this.logger.log(`Processed event ${event.event_type} (${event.id})`);
      } catch (error) {
        this.logger.error(
          `Failed to process event ${event.id}: ${error.message}`,
          error.stack,
        );
        await this.markFailed(event.id, error.message);
      }
    }
  }

  /**
   * Publish event to external systems
   * In production, this would publish to message queue (RabbitMQ, Kafka, etc.)
   */
  private async publishEvent(event: OrderOutbox): Promise<void> {
    // For now, just log. In production, publish to message queue
    this.logger.debug(
      `Publishing event: ${event.event_type} for ${event.aggregate_type}:${event.aggregate_id}`,
    );

    // Example implementations:
    // await this.rabbitMQService.publish(event.event_type, event.payload);
    // await this.kafkaService.send(event.event_type, event.payload);
    // await this.eventEmitter.emit(event.event_type, event.payload);

    // Simulate async processing
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  /**
   * Clean up old processed events (for housekeeping)
   */
  async cleanupProcessedEvents(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.outboxRepository
      .createQueryBuilder()
      .delete()
      .where('status = :status', { status: OutboxStatus.PROCESSED })
      .andWhere('processed_at < :cutoffDate', { cutoffDate })
      .execute();

    this.logger.log(
      `Cleaned up ${result.affected || 0} processed events older than ${olderThanDays} days`,
    );

    return result.affected || 0;
  }

  /**
   * Get event statistics
   */
  async getStatistics(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
  }> {
    const [pending, processing, processed, failed] = await Promise.all([
      this.outboxRepository.count({ where: { status: OutboxStatus.PENDING } }),
      this.outboxRepository.count({ where: { status: OutboxStatus.PROCESSING } }),
      this.outboxRepository.count({ where: { status: OutboxStatus.PROCESSED } }),
      this.outboxRepository.count({ where: { status: OutboxStatus.FAILED } }),
    ]);

    return { pending, processing, processed, failed };
  }
}
