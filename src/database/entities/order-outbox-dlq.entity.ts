import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

@Entity('order_outbox_dlq')
@Index(['event_type'])
@Index(['aggregate_type', 'aggregate_id'])
@Index(['moved_to_dlq_at'])
@Index(['reprocessed'])
export class OrderOutboxDLQ {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  original_event_id: string;

  @Column({ type: 'uuid' })
  @IsUUID()
  aggregate_id: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  aggregate_type: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  event_type: string;

  @Column({ type: 'jsonb' })
  @IsObject()
  payload: Record<string, any>;

  @Column({ type: 'text' })
  @IsString()
  error_message: string;

  @Column({ type: 'integer' })
  @IsInt()
  @Min(0)
  retry_count: number;

  @Column({ type: 'timestamp with time zone' })
  first_failed_at: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  moved_to_dlq_at: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  reprocessed: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  reprocessed_at: Date | null;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  metadata: Record<string, any>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  @IsOptional()
  idempotency_key: string | null;
}
