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
import {
  IsEnum,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  IsInt,
  Min,
  IsEmail,
} from 'class-validator';
import { User } from './user.entity';
import { CheckoutSession } from './checkout-session.entity';
import { OrderLineItem } from './order-line-item.entity';
import { Address } from './checkout-session.entity';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('orders')
@Index(['user_id', 'status'])
@Index(['order_number'], { unique: true })
@Index(['created_at'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  order_number: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  user_id: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Column({ type: 'varchar', length: 3 })
  @IsString()
  currency: string;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  subtotal: number;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  tax_amount: number;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  shipping_amount: number;

  @Column({ type: 'integer', default: 0 })
  @IsInt()
  @Min(0)
  discount_amount: number;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  total_amount: number;

  // Guest checkout
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsEmail()
  @IsOptional()
  guest_email: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsString()
  @IsOptional()
  guest_phone: string | null;

  // Addresses
  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  shipping_address: Address | null;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  billing_address: Address | null;

  // Payment info
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  payment_method: string | null;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus)
  payment_status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  payment_intent_id: string | null;

  // Metadata
  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  notes: string | null;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  checkout_session_id: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  completed_at: Date | null;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @ManyToOne(() => CheckoutSession, { nullable: true })
  @JoinColumn({ name: 'checkout_session_id' })
  checkout_session: CheckoutSession | null;

  @OneToMany(() => OrderLineItem, (lineItem) => lineItem.order, {
    cascade: true,
  })
  line_items: OrderLineItem[];

  // Virtual getters
  get customer_email(): string | null {
    return this.user?.email || this.guest_email;
  }

  get has_physical_items(): boolean {
    return this.line_items?.some((item) => item.type === 'physical') || false;
  }

  get has_digital_items(): boolean {
    return this.line_items?.some((item) => item.type === 'digital') || false;
  }

  get has_service_items(): boolean {
    return this.line_items?.some((item) => item.type === 'service') || false;
  }

  get merchant_ids(): string[] {
    if (!this.line_items) return [];
    return [...new Set(this.line_items.map((item) => item.merchant_id))];
  }

  get is_multi_merchant(): boolean {
    return this.merchant_ids.length > 1;
  }

  get total_items(): number {
    if (!this.line_items) return 0;
    return this.line_items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
