import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Payment } from './payment.entity';
import { OrderLineItem } from './order-line-item.entity';
import { User } from './user.entity';

export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('refunds')
@Index(['payment_id'])
@Index(['order_line_item_id'])
@Index(['status'])
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  payment_id: string;

  @Column({ type: 'uuid', nullable: true })
  order_line_item_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  provider_refund_id: string | null;

  @Column({ type: 'integer' })
  amount_minor: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: RefundStatus.PENDING,
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at: Date | null;

  // Relations
  @ManyToOne(() => Payment, (payment) => payment.refunds)
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @ManyToOne(() => OrderLineItem, { nullable: true })
  @JoinColumn({ name: 'order_line_item_id' })
  order_line_item: OrderLineItem | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User | null;

  // Virtual properties
  get is_processed(): boolean {
    return this.status === RefundStatus.COMPLETED;
  }

  get is_pending(): boolean {
    return this.status === RefundStatus.PENDING || this.status === RefundStatus.PROCESSING;
  }
}
