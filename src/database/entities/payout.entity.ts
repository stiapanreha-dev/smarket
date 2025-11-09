import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from './merchant.entity';
import { PayoutBatch } from './payout-batch.entity';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  STRIPE_CONNECT = 'stripe_connect',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
}

@Entity('payouts')
@Index(['merchant_id'])
@Index(['status'])
@Index(['batch_id'])
@Index(['created_at'])
@Index(['merchant_id', 'status'])
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  merchant_id: string;

  @Column({ type: 'integer' })
  amount_minor: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PayoutStatus.PENDING,
  })
  status: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  method: string | null;

  @Column({ type: 'jsonb', nullable: true })
  account_details: Record<string, any> | null;

  @Column({ type: 'uuid', nullable: true })
  batch_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_payout_id: string | null;

  @Column({ type: 'uuid', array: true, nullable: true })
  splits_included: string[] | null;

  @Column({ type: 'integer', default: 0 })
  processing_fee: number;

  @Column({ type: 'integer', nullable: true })
  net_amount: number | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  failure_code: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  arrived_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  cancelled_at: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => PayoutBatch, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: PayoutBatch | null;

  // Virtual properties
  get is_completed(): boolean {
    return this.status === PayoutStatus.COMPLETED;
  }

  get is_failed(): boolean {
    return this.status === PayoutStatus.FAILED;
  }

  get is_pending(): boolean {
    return this.status === PayoutStatus.PENDING;
  }

  get splits_count(): number {
    return this.splits_included?.length || 0;
  }

  get actual_amount(): number {
    return this.net_amount || this.amount_minor - this.processing_fee;
  }
}
