import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('webhook_events')
@Index(['provider', 'event_type'])
@Index(['processed'])
@Index(['provider', 'provider_event_id'], { unique: true })
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  provider_event_id: string;

  @Column({ type: 'varchar', length: 100 })
  event_type: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  processed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;
}
