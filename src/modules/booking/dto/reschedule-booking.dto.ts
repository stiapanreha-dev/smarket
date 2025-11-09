import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RescheduleBookingDto {
  @ApiProperty({
    description: 'New booking start time (ISO 8601)',
    example: '2024-07-16T14:00:00Z',
  })
  @IsDateString()
  new_start_at: string;

  @ApiPropertyOptional({
    description: 'Timezone for the new booking time',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;
}
