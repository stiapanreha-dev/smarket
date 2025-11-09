import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Payout } from './payout.entity';

export enum PayoutBatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payout_batches')
@Index(['status'])
@Index(['scheduled_for'])
@Index(['created_at'])
export class PayoutBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  batch_number: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PayoutBatchStatus.PENDING,
  })
  status: string;

  @Column({ type: 'integer', default: 0 })
  total_amount: number;

  @Column({ type: 'integer', default: 0 })
  total_payouts: number;

  @Column({ type: 'integer', default: 0 })
  successful_payouts: number;

  @Column({ type: 'integer', default: 0 })
  failed_payouts: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'timestamp with time zone' })
  scheduled_for: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Payout, (payout) => payout.batch)
  payouts: Payout[];

  // Virtual properties
  get is_completed(): boolean {
    return this.status === PayoutBatchStatus.COMPLETED;
  }

  get success_rate(): number {
    if (this.total_payouts === 0) return 0;
    return (this.successful_payouts / this.total_payouts) * 100;
  }

  get pending_payouts(): number {
    return this.total_payouts - this.successful_payouts - this.failed_payouts;
  }

  get duration_ms(): number | null {
    if (!this.started_at || !this.completed_at) return null;
    return this.completed_at.getTime() - this.started_at.getTime();
  }
}
