import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from './merchant.entity';

export enum ReconciliationReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ON_DEMAND = 'on-demand',
}

export enum ReconciliationReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ReconciliationDiscrepancy {
  type: 'missing_payout' | 'missing_split' | 'amount_mismatch' | 'status_mismatch';
  splitId?: string;
  payoutId?: string;
  expectedAmount?: number;
  actualAmount?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Entity('reconciliation_reports')
@Index(['report_date'])
@Index(['merchant_id'])
@Index(['type', 'status'])
export class ReconciliationReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  report_date: Date;

  @Column({ type: 'uuid', nullable: true })
  merchant_id: string | null;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ReconciliationReportStatus.PENDING,
  })
  status: string;

  @Column({ type: 'integer', default: 0 })
  total_splits: number;

  @Column({ type: 'integer', default: 0 })
  total_payouts: number;

  @Column({ type: 'bigint', default: 0 })
  splits_amount: number;

  @Column({ type: 'bigint', default: 0 })
  payouts_amount: number;

  @Column({ type: 'integer', default: 0 })
  discrepancy_count: number;

  @Column({ type: 'bigint', default: 0 })
  discrepancy_amount: number;

  @Column({ type: 'jsonb', default: [] })
  discrepancies: ReconciliationDiscrepancy[];

  @Column({ type: 'jsonb', default: {} })
  report_data: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  generated_by: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completed_at: Date | null;

  // Relations
  @ManyToOne(() => Merchant, { nullable: true })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant | null;

  // Virtual properties
  get is_reconciled(): boolean {
    return this.discrepancy_count === 0;
  }

  get has_critical_issues(): boolean {
    return this.discrepancies.some((d) => d.severity === 'critical');
  }

  get discrepancy_percentage(): number {
    if (this.splits_amount === 0) return 0;
    return (Math.abs(this.discrepancy_amount) / this.splits_amount) * 100;
  }
}
