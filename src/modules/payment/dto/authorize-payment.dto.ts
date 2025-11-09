import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthorizePaymentDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  orderId: string;

  @ApiPropertyOptional({
    description: 'Idempotency key for duplicate prevention',
    example: 'payment_order123_1699000000000',
  })
  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
