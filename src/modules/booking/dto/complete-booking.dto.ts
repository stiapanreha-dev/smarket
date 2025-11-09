import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteBookingDto {
  @ApiPropertyOptional({
    description: 'Provider notes about the completed service',
    example: 'Service completed successfully. Customer was satisfied.',
  })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  provider_notes?: string;
}
