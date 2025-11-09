import { IsDateString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GetAvailableSlotsDto {
  @ApiProperty({
    description: 'Date to check availability (YYYY-MM-DD)',
    example: '2024-07-15',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    description: 'Specific provider ID to check (optional)',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsOptional()
  provider_id?: string;
}
