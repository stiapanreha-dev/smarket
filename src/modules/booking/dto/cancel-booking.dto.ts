import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Schedule conflict',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}
