import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, LessThanOrEqual, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderOutbox,
  OutboxStatus,
  AggregateType,
} from '../../../database/entities/order-outbox.entity';
import { OrderOutboxDLQ } from '../../../database/entities/order-outbox-dlq.entity';

export interface OutboxEvent {
  aggregateId: string;
  aggregateType: AggregateType;
  eventType: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
}

export interface OutboxMetrics {
  pending: number;
  processing: number;
  processed: number;
  failed: number;
  dlqSize: number;
  avgProcessingTime: number;
  retryRate: number;
}

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_BACKOFF_MS = 1000; // 1 second
  private readonly MAX_BACKOFF_MS = 300000; // 5 minutes

  constructor(
    @InjectRepository(OrderOutbox)
    private readonly outboxRepository: Repository<OrderOutbox>,
    @InjectRepository(OrderOutboxDLQ)
    private readonly dlqRepository: Repository<OrderOutboxDLQ>,
    private readonly eventEmitter: EventEmitter2,
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
      next_retry_at: new Date(), // Ready for immediate processing
    });

    const saved = await repo.save(outboxEntry);

    this.logger.debug(
      `Event ${event.eventType} added to outbox for ${event.aggregateType}:${event.aggregateId}`,
    );

    return saved;
  }

  /**
   * Get pending events for processing with exponential backoff support
   */
  async getPendingEvents(limit: number = 100): Promise<OrderOutbox[]> {
    const now = new Date();

    return this.outboxRepository.find({
      where: [
        {
          status: OutboxStatus.PENDING,
          next_retry_at: LessThanOrEqual(now),
        },
        {
          status: OutboxStatus.FAILED,
          next_retry_at: LessThanOrEqual(now),
        },
      ],
      order: { created_at: 'ASC' },
      take: limit,
    });
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetry(retryCount: number): Date {
    const backoffMs = Math.min(
      this.INITIAL_BACKOFF_MS * Math.pow(2, retryCount),
      this.MAX_BACKOFF_MS,
    );

    // Add jitter (±20%) to prevent thundering herd
    const jitter = backoffMs * 0.2 * (Math.random() * 2 - 1);
    const totalBackoff = backoffMs + jitter;

    const nextRetry = new Date();
    nextRetry.setMilliseconds(nextRetry.getMilliseconds() + totalBackoff);

    return nextRetry;
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
   * Mark event as failed with exponential backoff
   */
  async markFailed(eventId: string, error: string): Promise<void> {
    const event = await this.outboxRepository.findOne({
      where: { id: eventId },
    });

    if (!event) return;

    const newRetryCount = event.retry_count + 1;

    // Check if max retries exceeded
    if (newRetryCount >= this.MAX_RETRIES) {
      await this.moveToDLQ(event, error);
      return;
    }

    const nextRetryAt = this.calculateNextRetry(newRetryCount);

    await this.outboxRepository.update(
      { id: eventId },
      {
        status: OutboxStatus.FAILED,
        retry_count: newRetryCount,
        error_message: error,
        next_retry_at: nextRetryAt,
      },
    );

    this.logger.warn(
      `Event ${event.event_type} (${eventId}) failed. Retry ${newRetryCount}/${this.MAX_RETRIES} scheduled for ${nextRetryAt.toISOString()}`,
    );
  }

  /**
   * Move event to Dead Letter Queue
   */
  async moveToDLQ(event: OrderOutbox, error: string): Promise<void> {
    const dlqEntry = this.dlqRepository.create({
      original_event_id: event.id,
      aggregate_id: event.aggregate_id,
      aggregate_type: event.aggregate_type,
      event_type: event.event_type,
      payload: event.payload,
      error_message: error,
      retry_count: event.retry_count,
      first_failed_at: event.created_at,
      idempotency_key: event.idempotency_key,
      metadata: {
        last_error: error,
        failed_at: new Date().toISOString(),
      },
    });

    await this.dlqRepository.save(dlqEntry);

    // Remove from outbox
    await this.outboxRepository.delete({ id: event.id });

    this.logger.error(
      `Event ${event.event_type} (${event.id}) moved to DLQ after ${event.retry_count} retries. Error: ${error}`,
    );
  }

  /**
   * Process all pending events
   */
  async processEvents(): Promise<{ processed: number; failed: number }> {
    const events = await this.getPendingEvents();
    let processed = 0;
    let failed = 0;

    for (const event of events) {
      try {
        await this.markProcessing(event.id);

        // Dispatch event to handlers via EventEmitter
        await this.dispatchEvent(event);

        await this.markProcessed(event.id);
        processed++;

        this.logger.log(
          `Processed event ${event.event_type} (${event.id}) for ${event.aggregate_type}:${event.aggregate_id}`,
        );
      } catch (error) {
        failed++;
        this.logger.error(
          `Failed to process event ${event.id}: ${error.message}`,
          error.stack,
        );
        await this.markFailed(event.id, error.message);
      }
    }

    return { processed, failed };
  }

  /**
   * Dispatch event to event handlers
   */
  private async dispatchEvent(event: OrderOutbox): Promise<void> {
    // Emit event using NestJS EventEmitter
    await this.eventEmitter.emitAsync(event.event_type, {
      id: event.id,
      aggregateId: event.aggregate_id,
      aggregateType: event.aggregate_type,
      eventType: event.event_type,
      payload: event.payload,
      createdAt: event.created_at,
    });
  }

  /**
   * Reprocess event from DLQ
   */
  async reprocessFromDLQ(dlqId: string): Promise<void> {
    const dlqEntry = await this.dlqRepository.findOne({
      where: { id: dlqId },
    });

    if (!dlqEntry || dlqEntry.reprocessed) {
      throw new Error('DLQ entry not found or already reprocessed');
    }

    // Create new outbox entry
    const outboxEntry = this.outboxRepository.create({
      aggregate_id: dlqEntry.aggregate_id,
      aggregate_type: dlqEntry.aggregate_type as AggregateType,
      event_type: dlqEntry.event_type,
      payload: dlqEntry.payload,
      status: OutboxStatus.PENDING,
      retry_count: 0,
      next_retry_at: new Date(),
    });

    await this.outboxRepository.save(outboxEntry);

    // Mark DLQ entry as reprocessed
    await this.dlqRepository.update(
      { id: dlqId },
      {
        reprocessed: true,
        reprocessed_at: new Date(),
      },
    );

    this.logger.log(`Reprocessing event from DLQ: ${dlqId}`);
  }

  /**
   * Clean up old processed events
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
   * Get comprehensive outbox metrics
   */
  async getMetrics(): Promise<OutboxMetrics> {
    const [statusCounts, dlqSize, avgTimeResult, retryStats] =
      await Promise.all([
        this.getStatusCounts(),
        this.dlqRepository.count(),
        this.getAverageProcessingTime(),
        this.getRetryStats(),
      ]);

    return {
      ...statusCounts,
      dlqSize,
      avgProcessingTime: avgTimeResult,
      retryRate: retryStats,
    };
  }

  private async getStatusCounts(): Promise<{
    pending: number;
    processing: number;
    processed: number;
    failed: number;
  }> {
    const [pending, processing, processed, failed] = await Promise.all([
      this.outboxRepository.count({ where: { status: OutboxStatus.PENDING } }),
      this.outboxRepository.count({
        where: { status: OutboxStatus.PROCESSING },
      }),
      this.outboxRepository.count({ where: { status: OutboxStatus.PROCESSED } }),
      this.outboxRepository.count({ where: { status: OutboxStatus.FAILED } }),
    ]);

    return { pending, processing, processed, failed };
  }

  private async getAverageProcessingTime(): Promise<number> {
    const result = await this.outboxRepository
      .createQueryBuilder('outbox')
      .select(
        'AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) * 1000',
        'avg_time',
      )
      .where('status = :status', { status: OutboxStatus.PROCESSED })
      .andWhere('processed_at IS NOT NULL')
      .getRawOne();

    return parseFloat(result?.avg_time || '0');
  }

  private async getRetryStats(): Promise<number> {
    const total = await this.outboxRepository.count();
    if (total === 0) return 0;

    const withRetries = await this.outboxRepository
      .createQueryBuilder('outbox')
      .where('retry_count > 0')
      .getCount();

    return (withRetries / total) * 100;
  }

  /**
   * Get outbox lag (time between created and processed)
   */
  async getOutboxLag(): Promise<number> {
    const result = await this.outboxRepository
      .createQueryBuilder('outbox')
      .select('EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000', 'lag')
      .where('status IN (:...statuses)', {
        statuses: [OutboxStatus.PENDING, OutboxStatus.FAILED],
      })
      .orderBy('created_at', 'ASC')
      .limit(1)
      .getRawOne();

    return parseFloat(result?.lag || '0');
  }
}
