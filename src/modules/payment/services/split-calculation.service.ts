import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../../database/entities/merchant.entity';
import { OrderLineItem } from '../../../database/entities/order-line-item.entity';

export interface SplitCalculation {
  merchant_id: string;
  gross_amount: number;
  platform_fee: number;
  processing_fee: number;
  net_amount: number;
}

export interface FeeConfig {
  physical: number; // 15%
  digital: number; // 20%
  service: number; // 10%
  processing_base: number; // 2.9%
  processing_fixed: number; // 30 cents
}

@Injectable()
export class SplitCalculationService {
  private readonly logger = new Logger(SplitCalculationService.name);

  // Default fee configuration
  private readonly defaultFees: FeeConfig = {
    physical: 0.15, // 15%
    digital: 0.2, // 20%
    service: 0.1, // 10%
    processing_base: 0.029, // 2.9%
    processing_fixed: 30, // 30 cents
  };

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepository: Repository<Merchant>,
  ) {}

  /**
   * Calculate payment splits for order line items
   */
  async calculateSplits(lineItems: OrderLineItem[]): Promise<SplitCalculation[]> {
    // Group line items by merchant
    const itemsByMerchant = this.groupByMerchant(lineItems);

    const splits: SplitCalculation[] = [];

    for (const [merchantId, items] of Object.entries(itemsByMerchant)) {
      // Calculate gross amount (sum of all items for this merchant)
      const grossAmount = items.reduce((sum, item) => sum + item.total_price, 0);

      // Get merchant-specific fee rate or use default
      const merchant = await this.merchantRepository.findOne({
        where: { id: merchantId },
      });

      const platformFee = this.calculatePlatformFee(items, grossAmount, merchant ?? undefined);
      const processingFee = this.calculateProcessingFee(grossAmount);
      const netAmount = grossAmount - platformFee - processingFee;

      splits.push({
        merchant_id: merchantId,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        processing_fee: processingFee,
        net_amount: netAmount,
      });

      this.logger.debug(
        `Split for merchant ${merchantId}: gross=${grossAmount}, platform_fee=${platformFee}, processing_fee=${processingFee}, net=${netAmount}`,
      );
    }

    return splits;
  }

  /**
   * Calculate platform fee based on item types
   */
  private calculatePlatformFee(
    items: OrderLineItem[],
    grossAmount: number,
    merchant?: Merchant,
  ): number {
    // If merchant has custom commission rate, use it
    if (merchant?.settings?.commission_rate !== undefined && merchant.settings.commission_rate !== null) {
      return Math.round(grossAmount * merchant.settings.commission_rate);
    }

    // Otherwise, calculate weighted average based on item types
    let totalFee = 0;

    for (const item of items) {
      const itemTotal = item.total_price;
      const feeRate = this.getFeeRate(item.type);
      totalFee += Math.round(itemTotal * feeRate);
    }

    return totalFee;
  }

  /**
   * Calculate processing fee (e.g., Stripe/payment gateway fees)
   */
  private calculateProcessingFee(grossAmount: number): number {
    // Processing fee = (amount * percentage) + fixed fee
    const percentageFee = Math.round(grossAmount * this.defaultFees.processing_base);
    const totalFee = percentageFee + this.defaultFees.processing_fixed;

    return totalFee;
  }

  /**
   * Get fee rate for item type
   */
  private getFeeRate(itemType: string): number {
    const rates: Record<string, number> = {
      physical: this.defaultFees.physical,
      digital: this.defaultFees.digital,
      service: this.defaultFees.service,
    };

    return rates[itemType] || this.defaultFees.physical;
  }

  /**
   * Group line items by merchant ID
   */
  private groupByMerchant(lineItems: OrderLineItem[]): Record<string, OrderLineItem[]> {
    const grouped: Record<string, OrderLineItem[]> = {};

    for (const item of lineItems) {
      if (!grouped[item.merchant_id]) {
        grouped[item.merchant_id] = [];
      }
      grouped[item.merchant_id].push(item);
    }

    return grouped;
  }

  /**
   * Calculate escrow release date based on item type
   */
  calculateEscrowReleaseDate(itemType: string): Date {
    const now = new Date();
    const daysToHold: Record<string, number> = {
      physical: 7, // Hold for 7 days after delivery
      digital: 3, // Hold for 3 days after download
      service: 1, // Hold for 1 day after service completion
    };

    const days = daysToHold[itemType] || 7;
    const releaseDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return releaseDate;
  }

  /**
   * Calculate refund split (proportional to original split)
   */
  calculateRefundSplit(
    originalSplit: SplitCalculation,
    refundAmount: number,
    originalPaymentAmount: number,
  ): {
    merchant_refund: number;
    platform_fee_refund: number;
    processing_fee_refund: number;
  } {
    const refundRatio = refundAmount / originalPaymentAmount;

    return {
      merchant_refund: Math.round(originalSplit.net_amount * refundRatio),
      platform_fee_refund: Math.round(originalSplit.platform_fee * refundRatio),
      processing_fee_refund: Math.round(originalSplit.processing_fee * refundRatio),
    };
  }
}
