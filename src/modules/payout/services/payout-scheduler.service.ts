import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PayoutService } from './payout.service';
import { ReconciliationService } from './reconciliation.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayoutBatch, PayoutBatchStatus } from '../../../database/entities/payout-batch.entity';
import { Merchant } from '../../../database/entities/merchant.entity';

@Injectable()
export class PayoutSchedulerService {
  private readonly logger = new Logger(PayoutSchedulerService.name);
  private isProcessing = false;

  constructor(
    private readonly payoutService: PayoutService,
    private readonly reconciliationService: ReconciliationService,
    @InjectRepository(PayoutBatch)
    private readonly batchRepository: Repository<PayoutBatch>,
  ) {}

  /**
   * Create weekly payouts
   * Runs every Friday at 10:00 AM
   */
  @Cron('0 10 * * 5', {
    name: 'weekly-payouts',
    timeZone: 'UTC',
  })
  async createWeeklyPayouts(): Promise<void> {
    if (this.isProcessing) {
      this.logger.warn('Weekly payout creation already in progress, skipping');
      return;
    }

    this.isProcessing = true;

    try {
      this.logger.log('Starting weekly payout creation');

      // Get all active merchants
      const merchants = await this.payoutService.getActiveMerchants();

      this.logger.log(`Found ${merchants.length} active merchants`);

      // Group merchants by currency
      const merchantsByCurrency = this.groupMerchantsByCurrency(merchants);

      const results = {
        total: 0,
        created: 0,
        skipped: 0,
        failed: 0,
      };

      // Process each currency group
      for (const [currency, currencyMerchants] of Object.entries(merchantsByCurrency)) {
        this.logger.log(
          `Processing ${currencyMerchants.length} merchants for currency ${currency}`,
        );

        // Create batch for this currency
        const batch = await this.payoutService.createPayoutBatch(currency);

        for (const merchant of currencyMerchants) {
          results.total++;

          try {
            // Calculate payout for merchant
            const calculation = await this.payoutService.calculatePayout(merchant.id);

            // Check if amount meets minimum
            const minAmount = this.payoutService.getMinimumPayout(calculation.currency);

            if (calculation.amount < minAmount) {
              this.logger.log(
                `Skipping payout for merchant ${merchant.id}: amount ${calculation.amount} below minimum ${minAmount}`,
              );
              results.skipped++;
              continue;
            }

            // Create payout
            await this.payoutService.createPayout({
              merchantId: merchant.id,
              amount: calculation.amount,
              currency: calculation.currency,
              splitsIncluded: calculation.splitsIncluded,
              batchId: batch.id,
            });

            results.created++;

            this.logger.log(
              `Created payout for merchant ${merchant.id}: ${calculation.amount} ${calculation.currency}`,
            );
          } catch (error) {
            results.failed++;
            this.logger.error(
              `Failed to create payout for merchant ${merchant.id}: ${error.message}`,
              error.stack,
            );
          }
        }

        // Update batch totals
        const batchPayouts = await this.batchRepository
          .createQueryBuilder('batch')
          .leftJoin('batch.payouts', 'payout')
          .where('batch.id = :batchId', { batchId: batch.id })
          .select('COUNT(payout.id)', 'count')
          .addSelect('SUM(payout.amount_minor)', 'total')
          .getRawOne();

        await this.batchRepository.update(batch.id, {
          total_payouts: parseInt(batchPayouts.count, 10) || 0,
          total_amount: parseInt(batchPayouts.total, 10) || 0,
          status: PayoutBatchStatus.PENDING,
        });

        this.logger.log(
          `Batch ${batch.batch_number} created with ${batchPayouts.count} payouts totaling ${batchPayouts.total} ${currency}`,
        );
      }

      this.logger.log(
        `Weekly payout creation completed: ${results.created} created, ${results.skipped} skipped, ${results.failed} failed out of ${results.total} total`,
      );
    } catch (error) {
      this.logger.error(`Error in weekly payout creation: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Generate daily reconciliation reports
   * Runs every day at 1:00 AM
   */
  @Cron('0 1 * * *', {
    name: 'daily-reconciliation',
    timeZone: 'UTC',
  })
  async generateDailyReconciliation(): Promise<void> {
    try {
      this.logger.log('Starting daily reconciliation');

      // Generate report for previous day
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const report = await this.reconciliationService.generateDailyReport(yesterday);

      if (!report.isReconciled) {
        this.logger.warn(
          `Daily reconciliation for ${yesterday.toISOString()} found ${
            report.discrepancies.length
          } discrepancies`,
        );
      } else {
        this.logger.log(
          `Daily reconciliation for ${yesterday.toISOString()} completed successfully`,
        );
      }
    } catch (error) {
      this.logger.error(`Error in daily reconciliation: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate weekly reconciliation reports
   * Runs every Monday at 2:00 AM
   */
  @Cron('0 2 * * 1', {
    name: 'weekly-reconciliation',
    timeZone: 'UTC',
  })
  async generateWeeklyReconciliation(): Promise<void> {
    try {
      this.logger.log('Starting weekly reconciliation');

      // Generate report for previous week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      const report = await this.reconciliationService.generateWeeklyReport(lastWeek);

      if (!report.isReconciled) {
        this.logger.warn(
          `Weekly reconciliation found ${report.discrepancies.length} discrepancies`,
        );
      } else {
        this.logger.log('Weekly reconciliation completed successfully');
      }
    } catch (error) {
      this.logger.error(`Error in weekly reconciliation: ${error.message}`, error.stack);
    }
  }

  /**
   * Process pending payouts
   * Runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'process-pending-payouts',
    timeZone: 'UTC',
  })
  async processPendingPayouts(): Promise<void> {
    try {
      this.logger.log('Processing pending payouts');

      // Get all pending batches
      const pendingBatches = await this.batchRepository.find({
        where: {
          status: PayoutBatchStatus.PENDING,
        },
        relations: ['payouts'],
      });

      for (const batch of pendingBatches) {
        // Update batch status to processing
        await this.batchRepository.update(batch.id, {
          status: PayoutBatchStatus.PROCESSING,
          started_at: new Date(),
        });

        // TODO: Process payouts in batch
        // For now, we just log
        this.logger.log(
          `Processing batch ${batch.batch_number} with ${batch.total_payouts} payouts`,
        );
      }
    } catch (error) {
      this.logger.error(`Error processing pending payouts: ${error.message}`, error.stack);
    }
  }

  /**
   * Group merchants by currency
   */
  private groupMerchantsByCurrency(merchants: Merchant[]): Record<string, Merchant[]> {
    return merchants.reduce(
      (groups, merchant) => {
        const currency = merchant.settings?.currency || 'USD';
        if (!groups[currency]) {
          groups[currency] = [];
        }
        groups[currency].push(merchant);
        return groups;
      },
      {} as Record<string, Merchant[]>,
    );
  }
}
