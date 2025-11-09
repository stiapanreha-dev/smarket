import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(private readonly outboxService: OutboxService) {}

  /**
   * Process outbox events every 10 seconds
   * Uses NestJS @Cron decorator for scheduling
   */
  @Cron('*/10 * * * * *', {
    name: 'processOutboxEvents',
  })
  async processEvents(): Promise<void> {
    // Prevent concurrent executions
    if (this.isProcessing) {
      this.logger.debug('Skipping outbox processing - already in progress');
      return;
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      this.logger.debug('Starting outbox event processing');

      const result = await this.outboxService.processEvents();

      const duration = Date.now() - startTime;

      if (result.processed > 0 || result.failed > 0) {
        this.logger.log(
          `Processed ${result.processed} events, ${result.failed} failed in ${duration}ms`,
        );
      }

      // Log metrics periodically
      if (result.processed > 0) {
        const metrics = await this.outboxService.getMetrics();
        this.logger.log(
          `Metrics: Pending=${metrics.pending}, Failed=${metrics.failed}, DLQ=${metrics.dlqSize}, AvgTime=${metrics.avgProcessingTime.toFixed(2)}ms, RetryRate=${metrics.retryRate.toFixed(2)}%`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing outbox events: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Clean up old processed events daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'cleanupProcessedEvents',
  })
  async cleanupProcessedEvents(): Promise<void> {
    try {
      this.logger.log('Starting cleanup of old processed events');

      const deleted = await this.outboxService.cleanupProcessedEvents(30);

      this.logger.log(`Cleanup completed: ${deleted} events removed`);
    } catch (error) {
      this.logger.error(`Error cleaning up processed events: ${error.message}`, error.stack);
    }
  }

  /**
   * Log metrics every minute
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'logOutboxMetrics',
  })
  async logMetrics(): Promise<void> {
    try {
      const metrics = await this.outboxService.getMetrics();
      const lag = await this.outboxService.getOutboxLag();

      this.logger.log(
        JSON.stringify({
          type: 'outbox_metrics',
          pending: metrics.pending,
          processing: metrics.processing,
          processed: metrics.processed,
          failed: metrics.failed,
          dlq_size: metrics.dlqSize,
          avg_processing_time_ms: metrics.avgProcessingTime.toFixed(2),
          retry_rate_percent: metrics.retryRate.toFixed(2),
          outbox_lag_ms: lag.toFixed(2),
        }),
      );
    } catch (error) {
      this.logger.error(`Error logging outbox metrics: ${error.message}`, error.stack);
    }
  }

  /**
   * Manual trigger for processing (useful for testing or admin actions)
   */
  async triggerProcessing(): Promise<void> {
    this.logger.log('Manual processing triggered');
    await this.processEvents();
  }
}
