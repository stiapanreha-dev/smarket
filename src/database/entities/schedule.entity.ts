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
  IsOptional,
  IsObject,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Service } from './service.entity';
import { User } from './user.entity';

export interface TimeSlot {
  start: string; // HH:mm format (e.g., "09:00")
  end: string; // HH:mm format (e.g., "18:00")
}

export interface WeeklySlots {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface ScheduleException {
  date: string; // ISO date format (YYYY-MM-DD)
  type?: 'holiday' | 'special'; // If type is 'holiday', no slots available
  slots?: TimeSlot[]; // Override slots for this specific date
}

@Entity('schedules')
@Unique(['service_id', 'provider_id'])
@Index(['service_id'])
@Index(['provider_id'])
export class Schedule {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ type: 'uuid', name: 'service_id' })
  @IsUUID()
  @Index()
  service_id: string;

  @Column({ type: 'uuid', name: 'provider_id', nullable: true })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @Column({ type: 'varchar', length: 50, default: 'UTC' })
  @IsString()
  timezone: string;

  @Column({
    type: 'jsonb',
    name: 'weekly_slots',
    default: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },
  })
  @IsObject()
  @ValidateNested()
  weekly_slots: WeeklySlots;

  @Column({ type: 'jsonb', default: [] })
  @IsObject()
  @ValidateNested()
  exceptions: ScheduleException[];

  @Column({ type: 'jsonb', default: {} })
  @IsObject()
  @IsOptional()
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at: Date;

  // Relations
  @ManyToOne(() => Service, (service) => service.schedules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'provider_id' })
  provider?: User;

  // Helper methods
  getSlotsForDay(day: keyof WeeklySlots): TimeSlot[] {
    return this.weekly_slots[day] || [];
  }

  getExceptionForDate(date: string): ScheduleException | undefined {
    return this.exceptions.find((ex) => ex.date === date);
  }

  isHoliday(date: string): boolean {
    const exception = this.getExceptionForDate(date);
    return exception?.type === 'holiday';
  }

  hasWorkingHours(): boolean {
    return Object.values(this.weekly_slots).some((slots) => slots.length > 0);
  }
}
