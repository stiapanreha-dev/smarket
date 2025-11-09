import { IsNumber, IsString, IsOptional, IsUUID, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiProperty({
    description: 'Refund amount in minor units (cents)',
    example: 5000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Reason for refund',
    example: 'Customer requested refund',
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Line item ID (for partial refunds)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  lineItemId?: string;
}
