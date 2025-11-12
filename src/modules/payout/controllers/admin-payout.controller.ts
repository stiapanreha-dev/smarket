import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { PayoutService } from '../services/payout.service';
import { ReconciliationService } from '../services/reconciliation.service';
import { PayoutResponseDto } from '../dto/payout-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payout, PayoutStatus } from '../../../database/entities/payout.entity';
import { PayoutBatch } from '../../../database/entities/payout-batch.entity';
import { UserRole } from '../../../database/entities/user.entity';

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminPayoutController {
  constructor(
    private readonly payoutService: PayoutService,
    private readonly reconciliationService: ReconciliationService,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(PayoutBatch)
    private readonly batchRepository: Repository<PayoutBatch>,
  ) {}

  /**
   * Get all payouts
   * GET /api/v1/admin/payouts
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllPayouts(
    @Query('status') status?: string,
    @Query('merchantId') merchantId?: string,
    @Query('batchId') batchId?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<{
    payouts: PayoutResponseDto[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const qb = this.payoutRepository
      .createQueryBuilder('payout')
      .orderBy('payout.created_at', 'DESC');

    if (status) {
      qb.andWhere('payout.status = :status', { status });
    }

    if (merchantId) {
      qb.andWhere('payout.merchant_id = :merchantId', { merchantId });
    }

    if (batchId) {
      qb.andWhere('payout.batch_id = :batchId', { batchId });
    }

    const total = await qb.getCount();

    const payouts = await qb.limit(Math.min(limit, 200)).offset(offset).getMany();

    return {
      payouts: payouts.map(PayoutResponseDto.fromEntity),
      total,
      limit,
      offset,
    };
  }

  /**
   * Get payout by ID
   * GET /api/v1/admin/payouts/:id
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getPayout(@Param('id') payoutId: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutService.getPayout(payoutId);
    return PayoutResponseDto.fromEntity(payout);
  }

  /**
   * Approve payout
   * POST /api/v1/admin/payouts/:id/approve
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approvePayout(@Param('id') payoutId: string): Promise<PayoutResponseDto> {
    const payout = await this.payoutService.processPayout(payoutId);
    return PayoutResponseDto.fromEntity(payout);
  }

  /**
   * Reject payout
   * POST /api/v1/admin/payouts/:id/reject
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectPayout(
    @Param('id') payoutId: string,
    @Body('reason') reason: string,
  ): Promise<PayoutResponseDto> {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    payout.status = PayoutStatus.CANCELLED;
    payout.error_message = reason;
    payout.cancelled_at = new Date();

    await this.payoutRepository.save(payout);

    return PayoutResponseDto.fromEntity(payout);
  }

  /**
   * Get all batches
   * GET /api/v1/admin/payouts/batches
   */
  @Get('batches/list')
  @HttpCode(HttpStatus.OK)
  async getBatches(
    @Query('status') status?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<{
    batches: any[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const qb = this.batchRepository.createQueryBuilder('batch').orderBy('batch.created_at', 'DESC');

    if (status) {
      qb.andWhere('batch.status = :status', { status });
    }

    const total = await qb.getCount();

    const batches = await qb.limit(Math.min(limit, 200)).offset(offset).getMany();

    return {
      batches,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get batch by ID
   * GET /api/v1/admin/payouts/batches/:id
   */
  @Get('batches/:id')
  @HttpCode(HttpStatus.OK)
  async getBatch(@Param('id') batchId: string): Promise<any> {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: ['payouts'],
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return batch;
  }

  /**
   * Get reconciliation reports
   * GET /api/v1/admin/payouts/reconciliation/reports
   */
  @Get('reconciliation/reports')
  @HttpCode(HttpStatus.OK)
  async getReconciliationReports(
    @Query('type') type?: string,
    @Query('merchantId') merchantId?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<any> {
    const { reports, total } = await this.reconciliationService.getReports({
      type: type as any,
      merchantId,
      limit: Math.min(limit, 200),
      offset,
    });

    return {
      reports,
      total,
      limit,
      offset,
    };
  }

  /**
   * Get reconciliation report by ID
   * GET /api/v1/admin/payouts/reconciliation/reports/:id
   */
  @Get('reconciliation/reports/:id')
  @HttpCode(HttpStatus.OK)
  async getReconciliationReport(@Param('id') reportId: string): Promise<any> {
    return this.reconciliationService.getReport(reportId);
  }

  /**
   * Generate reconciliation report
   * POST /api/v1/admin/payouts/reconciliation/generate
   */
  @Post('reconciliation/generate')
  @HttpCode(HttpStatus.OK)
  async generateReconciliationReport(
    @Body('type') type: 'daily' | 'weekly' | 'monthly',
    @Body('date') dateStr: string,
    @Body('merchantId') merchantId?: string,
  ): Promise<any> {
    const date = new Date(dateStr);

    let report;
    switch (type) {
      case 'daily':
        report = await this.reconciliationService.generateDailyReport(date, merchantId);
        break;
      case 'weekly':
        report = await this.reconciliationService.generateWeeklyReport(date, merchantId);
        break;
      case 'monthly':
        report = await this.reconciliationService.generateMonthlyReport(date, merchantId);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return report;
  }
}
