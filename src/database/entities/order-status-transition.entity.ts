import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { IsOptional, IsObject, IsString, IsUUID } from 'class-validator';
import { Order } from './order.entity';
import { OrderLineItem } from './order-line-item.entity';
import { User } from './user.entity';

@Entity('order_status_transitions')
@Index(['order_id'])
@Index(['line_item_id'])
@Index(['created_at'])
export class OrderStatusTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  order_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  line_item_id: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  from_status: string | null;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  to_status: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  reason: string | null;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  metadata: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  created_by: string | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at: Date;

  // Relations
  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @ManyToOne(() => OrderLineItem, { nullable: true })
  @JoinColumn({ name: 'line_item_id' })
  line_item: OrderLineItem | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by_user: User | null;
}
