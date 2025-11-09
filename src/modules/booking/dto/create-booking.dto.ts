import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Service ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  service_id: string;

  @ApiPropertyOptional({
    description: 'Specific provider ID (if service has multiple providers)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  provider_id?: string;

  @ApiProperty({
    description: 'Booking start time (ISO 8601)',
    example: '2024-07-15T10:00:00Z',
  })
  @IsDateString()
  start_at: string;

  @ApiPropertyOptional({
    description: 'Timezone for the booking',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Customer notes for the booking',
    example: 'Please use hypoallergenic products',
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  customer_notes?: string;
}
