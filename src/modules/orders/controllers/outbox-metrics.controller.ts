import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OutboxService, OutboxMetrics } from '../services/outbox.service';
import { OutboxProcessorService } from '../services/outbox-processor.service';

@ApiTags('outbox')
@Controller('outbox')
export class OutboxMetricsController {
  constructor(
    private readonly outboxService: OutboxService,
    private readonly outboxProcessor: OutboxProcessorService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get outbox metrics' })
  @ApiResponse({
    status: 200,
    description: 'Returns outbox metrics including lag, DLQ size, and retry rate',
  })
  async getMetrics(): Promise<OutboxMetrics & { outboxLag: number }> {
    const metrics = await this.outboxService.getMetrics();
    const outboxLag = await this.outboxService.getOutboxLag();

    return {
      ...metrics,
      outboxLag,
    };
  }

  @Post('process')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Manually trigger outbox processing' })
  @ApiResponse({
    status: 202,
    description: 'Outbox processing triggered',
  })
  async triggerProcessing(): Promise<{ message: string }> {
    // Trigger processing in background
    this.outboxProcessor.triggerProcessing();
    return { message: 'Outbox processing triggered' };
  }

  @Post('dlq/:id/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Reprocess event from Dead Letter Queue' })
  @ApiResponse({
    status: 202,
    description: 'Event reprocessing initiated',
  })
  @ApiResponse({
    status: 404,
    description: 'DLQ entry not found',
  })
  async reprocessFromDLQ(@Param('id') dlqId: string): Promise<{ message: string }> {
    await this.outboxService.reprocessFromDLQ(dlqId);
    return { message: `Event ${dlqId} moved from DLQ to outbox for reprocessing` };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check outbox system health' })
  @ApiResponse({
    status: 200,
    description: 'Returns health status of outbox system',
  })
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: OutboxMetrics & { outboxLag: number };
    alerts: string[];
  }> {
    const metrics = await this.outboxService.getMetrics();
    const outboxLag = await this.outboxService.getOutboxLag();

    const alerts: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check for high lag (>5 minutes)
    if (outboxLag > 300000) {
      alerts.push(`High outbox lag: ${(outboxLag / 1000).toFixed(2)}s`);
      status = 'unhealthy';
    } else if (outboxLag > 60000) {
      alerts.push(`Elevated outbox lag: ${(outboxLag / 1000).toFixed(2)}s`);
      status = 'degraded';
    }

    // Check for large DLQ
    if (metrics.dlqSize > 100) {
      alerts.push(`Large DLQ size: ${metrics.dlqSize} events`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // Check for high retry rate
    if (metrics.retryRate > 50) {
      alerts.push(`High retry rate: ${metrics.retryRate.toFixed(2)}%`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    // Check for stuck processing
    if (metrics.processing > 10) {
      alerts.push(`Many events stuck in processing: ${metrics.processing}`);
      status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      metrics: {
        ...metrics,
        outboxLag,
      },
      alerts,
    };
  }
}
