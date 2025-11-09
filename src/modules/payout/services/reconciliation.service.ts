import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import {
  ReconciliationReport,
  ReconciliationReportType,
  ReconciliationReportStatus,
  ReconciliationDiscrepancy,
} from '../../../database/entities/reconciliation-report.entity';
import { Payout, PayoutStatus } from '../../../database/entities/payout.entity';
import { PaymentSplit, PaymentSplitStatus } from '../../../database/entities/payment-split.entity';

export interface ReconciliationResult {
  reportId: string;
  isReconciled: boolean;
  discrepancies: ReconciliationDiscrepancy[];
  summary: {
    totalSplits: number;
    totalPayouts: number;
    splitsAmount: number;
    payoutsAmount: number;
    discrepancyAmount: number;
  };
}

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(ReconciliationReport)
    private readonly reportRepository: Repository<ReconciliationReport>,
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(PaymentSplit)
    private readonly splitRepository: Repository<PaymentSplit>,
  ) {}

  /**
   * Generate daily reconciliation report
   */
  async generateDailyReport(date: Date, merchantId?: string): Promise<ReconciliationResult> {
    this.logger.log(
      `Generating daily reconciliation report for ${date.toISOString()}${
        merchantId ? ` (merchant: ${merchantId})` : ''
      }`,
    );

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.generateReport({
      type: ReconciliationReportType.DAILY,
      reportDate: date,
      startDate: startOfDay,
      endDate: endOfDay,
      merchantId,
    });
  }

  /**
   * Generate weekly reconciliation report
   */
  async generateWeeklyReport(weekStart: Date, merchantId?: string): Promise<ReconciliationResult> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    this.logger.log(
      `Generating weekly reconciliation report for ${weekStart.toISOString()} - ${weekEnd.toISOString()}${
        merchantId ? ` (merchant: ${merchantId})` : ''
      }`,
    );

    return this.generateReport({
      type: ReconciliationReportType.WEEKLY,
      reportDate: weekStart,
      startDate: weekStart,
      endDate: weekEnd,
      merchantId,
    });
  }

  /**
   * Generate monthly reconciliation report
   */
  async generateMonthlyReport(month: Date, merchantId?: string): Promise<ReconciliationResult> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    this.logger.log(
      `Generating monthly reconciliation report for ${startOfMonth.toISOString()} - ${endOfMonth.toISOString()}${
        merchantId ? ` (merchant: ${merchantId})` : ''
      }`,
    );

    return this.generateReport({
      type: ReconciliationReportType.MONTHLY,
      reportDate: startOfMonth,
      startDate: startOfMonth,
      endDate: endOfMonth,
      merchantId,
    });
  }

  /**
   * Generate reconciliation report
   */
  private async generateReport(options: {
    type: ReconciliationReportType;
    reportDate: Date;
    startDate: Date;
    endDate: Date;
    merchantId?: string;
    generatedBy?: string;
  }): Promise<ReconciliationResult> {
    const discrepancies: ReconciliationDiscrepancy[] = [];

    // Get all splits in the period
    const splitsQuery = this.splitRepository
      .createQueryBuilder('split')
      .where('split.created_at BETWEEN :start AND :end', {
        start: options.startDate,
        end: options.endDate,
      })
      .andWhere('split.status = :status', {
        status: PaymentSplitStatus.PAID_OUT,
      });

    if (options.merchantId) {
      splitsQuery.andWhere('split.merchant_id = :merchantId', {
        merchantId: options.merchantId,
      });
    }

    const splits = await splitsQuery.getMany();

    // Get all payouts in the period
    const payoutsQuery = this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.created_at BETWEEN :start AND :end', {
        start: options.startDate,
        end: options.endDate,
      })
      .andWhere('payout.status IN (:...statuses)', {
        statuses: [PayoutStatus.COMPLETED, PayoutStatus.PROCESSING],
      });

    if (options.merchantId) {
      payoutsQuery.andWhere('payout.merchant_id = :merchantId', {
        merchantId: options.merchantId,
      });
    }

    const payouts = await payoutsQuery.getMany();

    // Calculate totals
    const splitsAmount = splits.reduce((sum, s) => sum + s.net_amount, 0);
    const payoutsAmount = payouts.reduce((sum, p) => sum + p.amount_minor, 0);

    // Check for splits without payouts
    const splitsWithoutPayouts = await this.splitRepository.find({
      where: {
        status: PaymentSplitStatus.CAPTURED,
        payout_id: IsNull(),
        created_at: Between(options.startDate, options.endDate),
        ...(options.merchantId && { merchant_id: options.merchantId }),
      },
    });

    for (const split of splitsWithoutPayouts) {
      // Check if escrow period has passed
      const escrowReleaseDate = split.escrow_release_date;
      if (escrowReleaseDate && escrowReleaseDate < new Date()) {
        discrepancies.push({
          type: 'missing_payout',
          splitId: split.id,
          expectedAmount: split.net_amount,
          description: `Split ${split.id} has no payout assigned despite escrow period ending`,
          severity: 'high',
        });
      }
    }

    // Check for payouts with mismatched splits
    for (const payout of payouts) {
      if (!payout.splits_included || payout.splits_included.length === 0) {
        discrepancies.push({
          type: 'missing_split',
          payoutId: payout.id,
          expectedAmount: payout.amount_minor,
          description: `Payout ${payout.id} has no splits assigned`,
          severity: 'critical',
        });
        continue;
      }

      // Verify splits total matches payout amount
      const payoutSplits = splits.filter((s) => payout.splits_included!.includes(s.id));

      const payoutSplitsTotal = payoutSplits.reduce((sum, s) => sum + s.net_amount, 0);

      if (Math.abs(payoutSplitsTotal - payout.amount_minor) > 1) {
        // Allow 1 minor unit variance for rounding
        discrepancies.push({
          type: 'amount_mismatch',
          payoutId: payout.id,
          expectedAmount: payoutSplitsTotal,
          actualAmount: payout.amount_minor,
          description: `Payout ${payout.id} amount ${payout.amount_minor} does not match splits total ${payoutSplitsTotal}`,
          severity: 'critical',
        });
      }

      // Check split statuses
      for (const split of payoutSplits) {
        if (split.status !== PaymentSplitStatus.PAID_OUT) {
          discrepancies.push({
            type: 'status_mismatch',
            splitId: split.id,
            payoutId: payout.id,
            description: `Split ${split.id} has status ${split.status} but is included in payout ${payout.id}`,
            severity: 'medium',
          });
        }
      }
    }

    const discrepancyAmount = discrepancies.reduce((sum, d) => {
      const amount = d.expectedAmount || 0;
      const actual = d.actualAmount || 0;
      return sum + Math.abs(amount - actual);
    }, 0);

    // Create report
    const report = this.reportRepository.create({
      report_date: options.reportDate,
      merchant_id: options.merchantId || null,
      type: options.type,
      status: ReconciliationReportStatus.COMPLETED,
      total_splits: splits.length,
      total_payouts: payouts.length,
      splits_amount: splitsAmount,
      payouts_amount: payoutsAmount,
      discrepancy_count: discrepancies.length,
      discrepancy_amount: discrepancyAmount,
      discrepancies,
      report_data: {
        period: {
          start: options.startDate,
          end: options.endDate,
        },
        splits: {
          total: splits.length,
          amount: splitsAmount,
        },
        payouts: {
          total: payouts.length,
          amount: payoutsAmount,
        },
      },
      generated_by: options.generatedBy || null,
      completed_at: new Date(),
    });

    await this.reportRepository.save(report);

    this.logger.log(
      `Reconciliation report ${report.id} completed: ${discrepancies.length} discrepancies found`,
    );

    if (discrepancies.length > 0) {
      this.logger.warn(`Reconciliation report ${report.id} found discrepancies:`, discrepancies);
    }

    return {
      reportId: report.id,
      isReconciled: discrepancies.length === 0,
      discrepancies,
      summary: {
        totalSplits: splits.length,
        totalPayouts: payouts.length,
        splitsAmount,
        payoutsAmount,
        discrepancyAmount,
      },
    };
  }

  /**
   * Get reconciliation report by ID
   */
  async getReport(reportId: string): Promise<ReconciliationReport> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: ['merchant'],
    });

    if (!report) {
      throw new Error(`Reconciliation report ${reportId} not found`);
    }

    return report;
  }

  /**
   * Get all reports
   */
  async getReports(
    options: {
      merchantId?: string;
      type?: ReconciliationReportType;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ reports: ReconciliationReport[]; total: number }> {
    const qb = this.reportRepository
      .createQueryBuilder('report')
      .orderBy('report.report_date', 'DESC');

    if (options.merchantId) {
      qb.where('report.merchant_id = :merchantId', {
        merchantId: options.merchantId,
      });
    }

    if (options.type) {
      qb.andWhere('report.type = :type', { type: options.type });
    }

    const total = await qb.getCount();

    if (options.limit) {
      qb.limit(options.limit);
    }

    if (options.offset) {
      qb.offset(options.offset);
    }

    const reports = await qb.getMany();

    return { reports, total };
  }

  /**
   * Get unreconciled reports
   */
  async getUnreconciledReports(): Promise<ReconciliationReport[]> {
    return this.reportRepository.find({
      where: {
        status: ReconciliationReportStatus.COMPLETED,
      },
      order: { report_date: 'DESC' },
    });
  }
}
