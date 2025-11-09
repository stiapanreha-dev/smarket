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
import { Payment } from './payment.entity';
import { Merchant } from './merchant.entity';

export enum PaymentSplitStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  ESCROWED = 'escrowed',
  RELEASED = 'released',
  PAID_OUT = 'paid_out',
  FAILED = 'failed',
}

@Entity('payment_splits')
@Index(['payment_id'])
@Index(['merchant_id'])
@Index(['status'])
@Index(['escrow_released', 'escrow_release_date'])
export class PaymentSplit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  payment_id: string;

  @Column({ type: 'uuid' })
  merchant_id: string;

  @Column({ type: 'integer' })
  gross_amount: number;

  @Column({ type: 'integer' })
  platform_fee: number;

  @Column({ type: 'integer', default: 0 })
  processing_fee: number;

  @Column({ type: 'integer' })
  net_amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: PaymentSplitStatus.PENDING,
  })
  status: string;

  @Column({ type: 'uuid', nullable: true })
  payout_id: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  escrow_release_date: Date | null;

  @Column({ type: 'boolean', default: false })
  escrow_released: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Payment, (payment) => payment.splits)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  // Virtual properties
  get is_ready_for_payout(): boolean {
    return this.status === PaymentSplitStatus.RELEASED && this.escrow_released && !this.payout_id;
  }

  get days_until_release(): number | null {
    if (!this.escrow_release_date) return null;
    const now = new Date();
    const releaseDate = new Date(this.escrow_release_date);
    const diffTime = releaseDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }
}
