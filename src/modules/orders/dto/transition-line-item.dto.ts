import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransitionLineItemDto {
  @ApiProperty({
    description: 'Target status',
    example: 'shipped',
  })
  @IsString()
  to_status: string;

  @ApiPropertyOptional({
    description: 'Reason for transition',
    example: 'Item shipped via FedEx',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata (e.g., tracking_number, carrier)',
    example: { tracking_number: '1234567890', carrier: 'FedEx' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
