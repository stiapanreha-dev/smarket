import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import {
  IsEnum,
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Service } from './service.entity';
import { User } from './user.entity';
import { OrderLineItem } from './order-line-item.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('bookings')
@Unique(['service_id', 'provider_id', 'start_at'])
@Index(['service_id'])
@Index(['customer_id'])
@Index(['provider_id'])
@Index(['start_at', 'end_at'])
@Index(['status'])
@Index(['order_line_item_id'])
@Index(['start_at', 'reminder_sent_at'])
@Index(['provider_id', 'start_at'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid', name: 'service_id' })
  @IsUUID()
  @Index()
  service_id: string;

  @Column({ type: 'uuid', name: 'order_line_item_id', nullable: true })
  @IsUUID()
  @IsOptional()
  order_line_item_id?: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @IsUUID()
  @Index()
  customer_id: string;

  @Column({ type: 'uuid', name: 'provider_id', nullable: true })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @Column({ type: 'timestamp with time zone', name: 'start_at' })
  @IsDate()
  @Index()
  start_at: Date;

  @Column({ type: 'timestamp with time zone', name: 'end_at' })
  @IsDate()
  end_at: Date;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  @IsString()
  timezone: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: BookingStatus.PENDING,
  })
  @IsEnum(BookingStatus)
  @Index()
  status: BookingStatus;

  @Column({ type: 'text', name: 'cancellation_reason', nullable: true })
  @IsString()
  @IsOptional()
  cancellation_reason?: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'cancelled_at',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  cancelled_at?: Date;

  @Column({ type: 'uuid', name: 'cancelled_by', nullable: true })
  @IsUUID()
  @IsOptional()
  cancelled_by?: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'completed_at',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  completed_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    name: 'no_show_at',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  no_show_at?: Date;

  @Column({
    type: 'timestamp with time zone',
    name: 'reminder_sent_at',
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  reminder_sent_at?: Date;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  @IsOptional()
  metadata: Record<string, any>;

  @Column({ type: 'text', name: 'customer_notes', nullable: true })
  @IsString()
  @IsOptional()
  customer_notes?: string;

  @Column({ type: 'text', name: 'provider_notes', nullable: true })
  @IsString()
  @IsOptional()
  provider_notes?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => OrderLineItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_line_item_id' })
  order_line_item?: OrderLineItem;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider?: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  canceller?: User;

  // Helper methods
  get is_cancellable(): boolean {
    return (
      this.status === BookingStatus.PENDING ||
      this.status === BookingStatus.CONFIRMED
    );
  }

  get is_modifiable(): boolean {
    return (
      this.status === BookingStatus.PENDING ||
      this.status === BookingStatus.CONFIRMED
    );
  }

  get is_completed(): boolean {
    return (
      this.status === BookingStatus.COMPLETED ||
      this.status === BookingStatus.NO_SHOW
    );
  }

  get duration_minutes(): number {
    return Math.round(
      (this.end_at.getTime() - this.start_at.getTime()) / (1000 * 60),
    );
  }

  get hours_until_start(): number {
    return (this.start_at.getTime() - Date.now()) / (1000 * 60 * 60);
  }

  canCancelWithinPolicy(cancelWindowHours: number = 24): boolean {
    if (!this.is_cancellable) return false;
    return this.hours_until_start >= cancelWindowHours;
  }

  needsReminder(): boolean {
    return (
      !this.reminder_sent_at &&
      (this.status === BookingStatus.PENDING ||
        this.status === BookingStatus.CONFIRMED) &&
      this.hours_until_start > 0 &&
      this.hours_until_start <= 24
    );
  }
}
