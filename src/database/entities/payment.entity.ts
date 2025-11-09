import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentSplit } from './payment-split.entity';
import { Refund } from './refund.entity';

export enum PaymentProvider {
  STRIPE = 'stripe',
  YOOKASSA = 'yookassa',
  NETWORK_INTL = 'network_intl',
}

export enum PaymentStatusEnum {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('payments')
@Index(['order_id'])
@Index(['provider', 'provider_payment_id'])
@Index(['status'])
@Index(['created_at'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  order_id: string;

  @Column({
    type: 'varchar',
    length: 50,
  })
  provider: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  provider_payment_id: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: PaymentStatusEnum.PENDING,
  })
  status: string;

  @Column({ type: 'integer' })
  amount_minor: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({ type: 'integer', nullable: true })
  authorized_amount: number | null;

  @Column({ type: 'integer', default: 0 })
  captured_amount: number;

  @Column({ type: 'integer', default: 0 })
  refunded_amount: number;

  @Column({ type: 'integer', default: 0 })
  platform_fee: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotency_key: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_method_type: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  payment_method_last4: string | null;

  @Column({ type: 'boolean', default: false })
  requires_action: boolean;

  @Column({ type: 'text', nullable: true })
  action_url: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  authorized_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  captured_at: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  failed_at: Date | null;

  // Relations
  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @OneToMany(() => PaymentSplit, (split) => split.payment, {
    cascade: true,
  })
  splits: PaymentSplit[];

  @OneToMany(() => Refund, (refund) => refund.payment)
  refunds: Refund[];

  // Virtual properties
  get is_fully_captured(): boolean {
    return this.captured_amount === this.amount_minor;
  }

  get is_fully_refunded(): boolean {
    return this.refunded_amount === this.captured_amount;
  }

  get is_partially_refunded(): boolean {
    return this.refunded_amount > 0 && this.refunded_amount < this.captured_amount;
  }

  get remaining_amount(): number {
    return this.captured_amount - this.refunded_amount;
  }
}
