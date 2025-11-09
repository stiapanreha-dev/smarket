import { IsString, IsOptional, IsUUID, IsObject, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WeeklySlots, ScheduleException } from '@database/entities/schedule.entity';

export class CreateScheduleDto {
  @ApiProperty({
    description: 'Service ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({
    description: 'Provider ID (if service is provider-specific)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @ApiPropertyOptional({
    description: 'Timezone (IANA timezone name)',
    example: 'America/New_York',
    default: 'UTC',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    description: 'Weekly recurring time slots',
    example: {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
      wednesday: [],
      thursday: [{ start: '09:00', end: '18:00' }],
      friday: [{ start: '09:00', end: '18:00' }],
      saturday: [{ start: '10:00', end: '16:00' }],
      sunday: [],
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  weekly_slots: WeeklySlots;

  @ApiPropertyOptional({
    description: 'Schedule exceptions (holidays, special days)',
    example: [
      { date: '2024-12-25', type: 'holiday' },
      { date: '2024-07-04', type: 'holiday' },
      { date: '2024-07-15', slots: [{ start: '10:00', end: '14:00' }] },
    ],
    default: [],
  })
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => Object)
  @IsOptional()
  exceptions?: ScheduleException[];

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
