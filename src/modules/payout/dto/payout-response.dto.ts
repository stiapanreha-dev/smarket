import { Payout } from '../../../database/entities/payout.entity';

export class PayoutResponseDto {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  splitsCount: number;
  processingFee: number;
  netAmount: number | null;
  processedAt: Date | null;
  arrivedAt: Date | null;
  createdAt: Date;

  static fromEntity(payout: Payout): PayoutResponseDto {
    return {
      id: payout.id,
      merchantId: payout.merchant_id,
      amount: payout.amount_minor,
      currency: payout.currency,
      status: payout.status,
      method: payout.method,
      splitsCount: payout.splits_count,
      processingFee: payout.processing_fee,
      netAmount: payout.net_amount,
      processedAt: payout.processed_at,
      arrivedAt: payout.arrived_at,
      createdAt: payout.created_at,
    };
  }
}
