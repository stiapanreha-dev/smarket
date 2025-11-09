import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, LessThan, IsNull, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payout, PayoutStatus } from '../../../database/entities/payout.entity';
import { PayoutBatch, PayoutBatchStatus } from '../../../database/entities/payout-batch.entity';
import { PaymentSplit, PaymentSplitStatus } from '../../../database/entities/payment-split.entity';
import { Merchant, MerchantStatus } from '../../../database/entities/merchant.entity';
import { OutboxService } from '../../orders/services/outbox.service';
import { AggregateType } from '../../../database/entities/order-outbox.entity';

export interface PayoutCalculation {
  merchantId: string;
  amount: number;
  currency: string;
  splitsIncluded: string[];
  splitCount: number;
}

export interface CreatePayoutOptions {
  merchantId: string;
  amount: number;
  currency: string;
  splitsIncluded: string[];
  batchId?: string;
}

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);
  private readonly ESCROW_PERIOD_DAYS = 7;
  private readonly MIN_PAYOUT_AMOUNTS: Record<string, number> = {
    USD: 10000, // $100.00
    EUR: 10000, // €100.00
    RUB: 1000000, // ₽10,000.00
    AED: 36700, // AED 367.00
  };

  constructor(
    @InjectRepository(Payout)
    private readonly payoutRepository: Repository<Payout>,
    @InjectRepository(PayoutBatch)
    private readonly batchRepository: Repository<PayoutBatch>,
    @InjectRepository(PaymentSplit)
    private readonly splitRepository: Repository<PaymentSplit>,
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
    private readonly dataSource: DataSource,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Calculate payout for a merchant
   */
  async calculatePayout(merchantId: string): Promise<PayoutCalculation> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    // Get all splits ready for payout
    const escrowDate = new Date();
    escrowDate.setDate(escrowDate.getDate() - this.ESCROW_PERIOD_DAYS);

    const splits = await this.splitRepository.find({
      where: {
        merchant_id: merchantId,
        status: PaymentSplitStatus.CAPTURED,
        payout_id: IsNull(),
        escrow_released: true,
        escrow_release_date: LessThan(escrowDate),
      },
    });

    const totalAmount = splits.reduce((sum, split) => sum + split.net_amount, 0);
    const splitsIncluded = splits.map((s) => s.id);

    return {
      merchantId,
      amount: totalAmount,
      currency: merchant.settings?.currency || 'USD',
      splitsIncluded,
      splitCount: splits.length,
    };
  }

  /**
   * Calculate pending balance for merchant (including unreleased escrow)
   */
  async calculateMerchantBalance(merchantId: string): Promise<{
    available: number;
    pending: number;
    escrowed: number;
    total: number;
    currency: string;
  }> {
    const merchant = await this.merchantRepository.findOne({
      where: { id: merchantId },
    });

    if (!merchant) {
      throw new NotFoundException(`Merchant ${merchantId} not found`);
    }

    const currency = merchant.settings?.currency || 'USD';
    const escrowDate = new Date();
    escrowDate.setDate(escrowDate.getDate() - this.ESCROW_PERIOD_DAYS);

    // Available: released from escrow and not paid out
    const availableSplits = await this.splitRepository
      .createQueryBuilder('split')
      .where('split.merchant_id = :merchantId', { merchantId })
      .andWhere('split.status = :status', { status: PaymentSplitStatus.CAPTURED })
      .andWhere('split.payout_id IS NULL')
      .andWhere('split.escrow_released = true')
      .andWhere('split.escrow_release_date < :escrowDate', { escrowDate })
      .select('SUM(split.net_amount)', 'total')
      .getRawOne();

    // Escrowed: not yet released
    const escrowedSplits = await this.splitRepository
      .createQueryBuilder('split')
      .where('split.merchant_id = :merchantId', { merchantId })
      .andWhere('split.status = :status', { status: PaymentSplitStatus.CAPTURED })
      .andWhere('split.payout_id IS NULL')
      .andWhere('split.escrow_released = false')
      .select('SUM(split.net_amount)', 'total')
      .getRawOne();

    // Pending: in payout but not yet completed
    const pendingPayouts = await this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.merchant_id = :merchantId', { merchantId })
      .andWhere('payout.status IN (:...statuses)', {
        statuses: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
      })
      .select('SUM(payout.amount_minor)', 'total')
      .getRawOne();

    const available = parseInt(availableSplits?.total || '0', 10);
    const escrowed = parseInt(escrowedSplits?.total || '0', 10);
    const pending = parseInt(pendingPayouts?.total || '0', 10);

    return {
      available,
      pending,
      escrowed,
      total: available + pending + escrowed,
      currency,
    };
  }

  /**
   * Create payout for merchant
   */
  async createPayout(options: CreatePayoutOptions): Promise<Payout> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, {
        where: { id: options.merchantId },
      });

      if (!merchant) {
        throw new NotFoundException(`Merchant ${options.merchantId} not found`);
      }

      if (merchant.status !== MerchantStatus.ACTIVE) {
        throw new BadRequestException(
          `Merchant ${options.merchantId} is not active`,
        );
      }

      // Check minimum payout amount
      const minAmount = this.getMinimumPayout(options.currency);
      if (options.amount < minAmount) {
        throw new BadRequestException(
          `Payout amount ${options.amount} is below minimum ${minAmount} for ${options.currency}`,
        );
      }

      // Verify splits are available
      const splits = await manager.find(PaymentSplit, {
        where: {
          id: In(options.splitsIncluded),
          merchant_id: options.merchantId,
          payout_id: IsNull(),
        },
      });

      if (splits.length !== options.splitsIncluded.length) {
        throw new BadRequestException(
          `Some splits are not available for payout`,
        );
      }

      // Create payout
      const payout = manager.create(Payout, {
        merchant_id: options.merchantId,
        amount_minor: options.amount,
        currency: options.currency,
        method: merchant.payout_method,
        account_details: merchant.payout_details,
        batch_id: options.batchId || null,
        splits_included: options.splitsIncluded,
        status: PayoutStatus.PENDING,
        metadata: {
          splits_count: splits.length,
          created_by: 'system',
        },
      });

      await manager.save(payout);

      // Link splits to payout
      await manager.update(
        PaymentSplit,
        { id: In(options.splitsIncluded) },
        {
          payout_id: payout.id,
          status: PaymentSplitStatus.PAID_OUT,
        },
      );

      // Add event to outbox
      await this.outboxService.addEvent(
        {
          aggregateId: payout.id,
          aggregateType: AggregateType.PAYMENT,
          eventType: 'payout.created',
          payload: {
            payoutId: payout.id,
            merchantId: payout.merchant_id,
            amount: payout.amount_minor,
            currency: payout.currency,
            splitsCount: splits.length,
          },
        },
        manager,
      );

      this.logger.log(
        `Payout created: ${payout.id} for merchant ${options.merchantId}, amount: ${options.amount} ${options.currency}`,
      );

      return payout;
    });
  }

  /**
   * Get all active merchants eligible for payouts
   */
  async getActiveMerchants(): Promise<Merchant[]> {
    return this.merchantRepository.find({
      where: {
        status: MerchantStatus.ACTIVE,
      },
    });
  }

  /**
   * Get minimum payout amount for currency
   */
  getMinimumPayout(currency: string): number {
    return this.MIN_PAYOUT_AMOUNTS[currency.toUpperCase()] || 10000; // Default $100.00
  }

  /**
   * Create batch of payouts
   */
  async createPayoutBatch(currency: string): Promise<PayoutBatch> {
    return this.dataSource.transaction(async (manager) => {
      const batchNumber = this.generateBatchNumber();
      const scheduledFor = new Date();

      // Create batch
      const batch = manager.create(PayoutBatch, {
        batch_number: batchNumber,
        status: PayoutBatchStatus.PENDING,
        currency,
        scheduled_for: scheduledFor,
        metadata: {
          created_by: 'cron',
        },
      });

      await manager.save(batch);

      this.logger.log(`Payout batch created: ${batch.id} (${batchNumber})`);

      return batch;
    });
  }

  /**
   * Process payout (call provider)
   */
  async processPayout(payoutId: string): Promise<Payout> {
    return this.dataSource.transaction(async (manager) => {
      const payout = await manager.findOne(Payout, {
        where: { id: payoutId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!payout) {
        throw new NotFoundException(`Payout ${payoutId} not found`);
      }

      if (payout.status !== PayoutStatus.PENDING) {
        throw new BadRequestException(
          `Cannot process payout in status ${payout.status}`,
        );
      }

      try {
        // Update status to processing
        payout.status = PayoutStatus.PROCESSING;
        payout.processed_at = new Date();
        await manager.save(payout);

        // TODO: Call payment provider to execute payout
        // For now, we'll simulate success
        // const result = await this.payoutProvider.transfer({
        //   amount: payout.amount_minor,
        //   currency: payout.currency,
        //   destination: payout.account_details,
        // });

        // Simulate processing
        payout.status = PayoutStatus.COMPLETED;
        payout.net_amount = payout.amount_minor; // In real scenario, provider may deduct fees
        await manager.save(payout);

        // Add event to outbox
        await this.outboxService.addEvent(
          {
            aggregateId: payout.id,
            aggregateType: AggregateType.PAYMENT,
            eventType: 'payout.completed',
            payload: {
              payoutId: payout.id,
              merchantId: payout.merchant_id,
              amount: payout.amount_minor,
              netAmount: payout.net_amount,
            },
          },
          manager,
        );

        this.logger.log(`Payout processed: ${payout.id}`);

        return payout;
      } catch (error) {
        // Mark as failed
        payout.status = PayoutStatus.FAILED;
        payout.error_message = error.message;
        await manager.save(payout);

        await this.outboxService.addEvent(
          {
            aggregateId: payout.id,
            aggregateType: AggregateType.PAYMENT,
            eventType: 'payout.failed',
            payload: {
              payoutId: payout.id,
              merchantId: payout.merchant_id,
              error: error.message,
            },
          },
          manager,
        );

        throw error;
      }
    });
  }

  /**
   * Get payout by ID
   */
  async getPayout(payoutId: string): Promise<Payout> {
    const payout = await this.payoutRepository.findOne({
      where: { id: payoutId },
      relations: ['merchant', 'batch'],
    });

    if (!payout) {
      throw new NotFoundException(`Payout ${payoutId} not found`);
    }

    return payout;
  }

  /**
   * Get payouts for merchant
   */
  async getMerchantPayouts(
    merchantId: string,
    options: {
      status?: PayoutStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ payouts: Payout[]; total: number }> {
    const qb = this.payoutRepository
      .createQueryBuilder('payout')
      .where('payout.merchant_id = :merchantId', { merchantId })
      .orderBy('payout.created_at', 'DESC');

    if (options.status) {
      qb.andWhere('payout.status = :status', { status: options.status });
    }

    const total = await qb.getCount();

    if (options.limit) {
      qb.limit(options.limit);
    }

    if (options.offset) {
      qb.offset(options.offset);
    }

    const payouts = await qb.getMany();

    return { payouts, total };
  }

  /**
   * Generate batch number
   */
  private generateBatchNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    const timestamp = now.getTime();
    return `BATCH-${year}-W${week}-${timestamp}`;
  }

  /**
   * Get week number of year
   */
  private getWeekNumber(date: Date): number {
    const d = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
    );
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
}
