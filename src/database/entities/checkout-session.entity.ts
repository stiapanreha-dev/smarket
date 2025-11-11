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
import { IsEnum, IsOptional, IsObject, IsString, IsUUID, IsDateString } from 'class-validator';
import { User } from './user.entity';

export enum CheckoutStep {
  CART_REVIEW = 'cart_review',
  SHIPPING_ADDRESS = 'shipping_address',
  DELIVERY_METHOD = 'delivery_method',
  PAYMENT_METHOD = 'payment_method',
  ORDER_REVIEW = 'order_review',
  PAYMENT = 'payment',
  CONFIRMATION = 'confirmation',
}

export enum CheckoutStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum DeliveryMethodType {
  STANDARD = 'standard',
  EXPRESS = 'express',
  PICKUP = 'pickup',
}

export interface DeliveryOption {
  type: DeliveryMethodType;
  name: string;
  description: string;
  price: number; // In minor units (cents)
  currency: string;
  estimatedDays: {
    min: number;
    max: number;
  };
}

export enum PaymentMethodType {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  CRYPTO = 'crypto',
  CASH_ON_DELIVERY = 'cash_on_delivery',
}

export interface CartItemSnapshot {
  productId: string;
  variantId: string;
  quantity: number;
  price: number; // In minor units (cents)
  currency: string;
  merchantId: string;
  type: 'physical' | 'digital' | 'service';
  productName: string;
  variantName?: string;
  sku?: string;
  metadata?: Record<string, any>;
}

export interface Address {
  country: string;
  state?: string;
  city: string;
  street: string;
  street2?: string;
  postal_code: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  company?: string;
}

export interface CheckoutTotals {
  subtotal: number; // In minor units
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  tax_rate?: number; // Percentage
  tax_details?: {
    rate: number;
    amount: number;
    jurisdiction: string;
  }[];
}

export interface PromoCodeApplication {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applied_at: Date;
}

@Entity('checkout_sessions')
@Index(['user_id', 'status'])
@Index(['session_id'])
@Index(['status', 'expires_at'])
@Index(['created_at'])
export class CheckoutSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  user_id: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  session_id: string | null;

  @Column({ type: 'jsonb' })
  @IsObject()
  cart_snapshot: CartItemSnapshot[];

  @Column({
    type: 'enum',
    enum: CheckoutStep,
    default: CheckoutStep.CART_REVIEW,
  })
  @IsEnum(CheckoutStep)
  step: CheckoutStep;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  shipping_address: Address | null;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  billing_address: Address | null;

  @Column({
    type: 'enum',
    enum: DeliveryMethodType,
    nullable: true,
  })
  @IsEnum(DeliveryMethodType)
  @IsOptional()
  delivery_method: DeliveryMethodType | null;

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
    nullable: true,
  })
  @IsEnum(PaymentMethodType)
  @IsOptional()
  payment_method: PaymentMethodType | null;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  payment_details: Record<string, any> | null;

  @Column({ type: 'jsonb' })
  @IsObject()
  totals: CheckoutTotals;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  promo_codes: PromoCodeApplication[] | null;

  @Column({
    type: 'enum',
    enum: CheckoutStatus,
    default: CheckoutStatus.IN_PROGRESS,
  })
  @IsEnum(CheckoutStatus)
  status: CheckoutStatus;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @IsString()
  @IsOptional()
  idempotency_key: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  order_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  order_number: string | null;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  error_message: string | null;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  metadata: Record<string, any> | null;

  @Column({ type: 'timestamp with time zone' })
  @IsDateString()
  expires_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsDateString()
  @IsOptional()
  completed_at: Date | null;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  // Virtual fields
  get is_expired(): boolean {
    return new Date() > this.expires_at && this.status === CheckoutStatus.IN_PROGRESS;
  }

  get has_physical_items(): boolean {
    return this.cart_snapshot.some((item) => item.type === 'physical');
  }

  get requires_shipping(): boolean {
    return this.has_physical_items;
  }

  get merchant_ids(): string[] {
    return [...new Set(this.cart_snapshot.map((item) => item.merchantId))];
  }

  get total_items(): number {
    return this.cart_snapshot.reduce((sum, item) => sum + item.quantity, 0);
  }
}
