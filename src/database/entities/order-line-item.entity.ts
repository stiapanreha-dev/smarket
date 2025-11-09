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
import {
  IsEnum,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Merchant } from './merchant.entity';

export enum LineItemType {
  PHYSICAL = 'physical',
  DIGITAL = 'digital',
  SERVICE = 'service',
}

// Physical Item States
export enum PhysicalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

// Digital Item States
export enum DigitalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCESS_GRANTED = 'access_granted',
  DOWNLOADED = 'downloaded',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

// Service Item States
export enum ServiceItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  BOOKING_CONFIRMED = 'booking_confirmed',
  REMINDER_SENT = 'reminder_sent',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded',
}

export enum FulfillmentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export interface StatusHistoryEntry {
  from?: string;
  to: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Fulfillment data interfaces
export interface PhysicalFulfillmentData {
  warehouse_id?: string;
  tracking_number?: string;
  carrier?: string;
  estimated_delivery?: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}

export interface DigitalFulfillmentData {
  download_url?: string;
  access_key?: string;
  expires_at?: Date;
  download_count?: number;
  max_downloads?: number;
}

export interface ServiceFulfillmentData {
  booking_id?: string;
  booking_date?: Date;
  booking_slot?: string;
  specialist_id?: string;
  location?: string;
  notes?: string;
}

@Entity('order_line_items')
@Index(['order_id'])
@Index(['merchant_id'])
@Index(['status'])
@Index(['type'])
export class OrderLineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  order_id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  merchant_id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  product_id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  variant_id: string | null;

  @Column({
    type: 'enum',
    enum: LineItemType,
  })
  @IsEnum(LineItemType)
  type: LineItemType;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @IsString()
  status: string;

  // Product snapshot
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  product_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  product_sku: string | null;

  @Column({ type: 'jsonb', nullable: true })
  @IsObject()
  @IsOptional()
  variant_attributes: Record<string, any> | null;

  // Pricing
  @Column({ type: 'integer' })
  @IsInt()
  @Min(1)
  quantity: number;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  unit_price: number;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  total_price: number;

  @Column({ type: 'varchar', length: 3 })
  @IsString()
  currency: string;

  // Fulfillment
  @Column({
    type: 'enum',
    enum: FulfillmentStatus,
    default: FulfillmentStatus.PENDING,
  })
  @IsEnum(FulfillmentStatus)
  fulfillment_status: FulfillmentStatus;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  fulfillment_data:
    | PhysicalFulfillmentData
    | DigitalFulfillmentData
    | ServiceFulfillmentData
    | Record<string, any>;

  // FSM tracking
  @Column({ type: 'jsonb', default: [] })
  @IsObject()
  status_history: StatusHistoryEntry[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  last_status_change: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Order, (order) => order.line_items)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant | null;

  // Helper methods
  get is_cancellable(): boolean {
    if (this.type === LineItemType.PHYSICAL) {
      return [
        PhysicalItemStatus.PENDING,
        PhysicalItemStatus.PAYMENT_CONFIRMED,
        PhysicalItemStatus.PREPARING,
      ].includes(this.status as PhysicalItemStatus);
    }
    if (this.type === LineItemType.DIGITAL) {
      return [
        DigitalItemStatus.PENDING,
        DigitalItemStatus.PAYMENT_CONFIRMED,
      ].includes(this.status as DigitalItemStatus);
    }
    if (this.type === LineItemType.SERVICE) {
      return [
        ServiceItemStatus.PENDING,
        ServiceItemStatus.PAYMENT_CONFIRMED,
        ServiceItemStatus.BOOKING_CONFIRMED,
      ].includes(this.status as ServiceItemStatus);
    }
    return false;
  }

  get is_refundable(): boolean {
    if (this.type === LineItemType.PHYSICAL) {
      return [
        PhysicalItemStatus.DELIVERED,
      ].includes(this.status as PhysicalItemStatus);
    }
    if (this.type === LineItemType.DIGITAL) {
      return [
        DigitalItemStatus.ACCESS_GRANTED,
        DigitalItemStatus.DOWNLOADED,
      ].includes(this.status as DigitalItemStatus);
    }
    if (this.type === LineItemType.SERVICE) {
      return [
        ServiceItemStatus.COMPLETED,
        ServiceItemStatus.NO_SHOW,
      ].includes(this.status as ServiceItemStatus);
    }
    return false;
  }
}
