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
import { IsEnum, IsOptional, IsObject, IsString, IsUUID, IsInt, Min, IsIn } from 'class-validator';
import { Merchant } from './merchant.entity';
import { User } from './user.entity';
import { Schedule } from './schedule.entity';
import { Booking } from './booking.entity';

export enum ServiceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum ServiceCategory {
  HAIRCUT = 'haircut',
  HAIR_COLOR = 'hair_color',
  MASSAGE = 'massage',
  MANICURE = 'manicure',
  PEDICURE = 'pedicure',
  FACIAL = 'facial',
  WAXING = 'waxing',
  MAKEUP = 'makeup',
  TATTOO = 'tattoo',
  PIERCING = 'piercing',
  BARBER = 'barber',
  SPA = 'spa',
  CONSULTATION = 'consultation',
  OTHER = 'other',
}

@Entity('services')
@Index(['merchant_id'])
@Index(['provider_id'])
@Index(['status'])
@Index(['category'])
export class Service {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid', name: 'merchant_id' })
  @IsUUID()
  merchant_id: string;

  @Column({ type: 'uuid', name: 'provider_id', nullable: true })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  name: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @IsEnum(ServiceCategory)
  category?: ServiceCategory;

  @Column({ type: 'int', name: 'duration_minutes' })
  @IsInt()
  @Min(1)
  duration_minutes: number;

  @Column({ type: 'int', name: 'buffer_minutes', default: 0 })
  @IsInt()
  @Min(0)
  buffer_minutes: number;

  @Column({ type: 'int', name: 'price_minor' })
  @IsInt()
  @Min(0)
  price_minor: number;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  @IsString()
  currency: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ServiceStatus.ACTIVE,
  })
  @IsEnum(ServiceStatus)
  status: ServiceStatus;

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  @IsOptional()
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider?: User;

  @OneToMany(() => Schedule, (schedule) => schedule.service)
  schedules: Schedule[];

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Booking[];

  // Helper methods
  get is_active(): boolean {
    return this.status === ServiceStatus.ACTIVE;
  }

  get total_duration_minutes(): number {
    return this.duration_minutes + this.buffer_minutes;
  }

  get price_display(): string {
    return `${(this.price_minor / 100).toFixed(2)} ${this.currency}`;
  }
}
