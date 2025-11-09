import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
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

export enum OutboxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export enum AggregateType {
  ORDER = 'order',
  ORDER_LINE_ITEM = 'order_line_item',
}

@Entity('order_outbox')
@Index(['status', 'created_at'])
@Index(['aggregate_type', 'aggregate_id'])
@Index(['event_type'])
export class OrderOutbox {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  aggregate_id: string;

  @Column({
    type: 'enum',
    enum: AggregateType,
  })
  @IsEnum(AggregateType)
  aggregate_type: AggregateType;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  event_type: string;

  @Column({ type: 'jsonb' })
  @IsObject()
  payload: Record<string, any>;

  @Column({
    type: 'enum',
    enum: OutboxStatus,
    default: OutboxStatus.PENDING,
  })
  @IsEnum(OutboxStatus)
  status: OutboxStatus;

  @Column({ type: 'integer', default: 0 })
  @IsInt()
  @Min(0)
  retry_count: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  error_message: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  processed_at: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  @IsString()
  @IsOptional()
  idempotency_key: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  next_retry_at: Date | null;
}
