import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentResponseDto, RefundResponseDto } from './payment-response.dto';

export class GetUserPaymentsDto {
  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UserPaymentItemDto {
  @ApiProperty({ description: 'Payment ID' })
  id: string;

  @ApiProperty({ description: 'Order ID' })
  orderId: string;

  @ApiPropertyOptional({ description: 'Order number' })
  orderNumber?: string;

  @ApiProperty({ description: 'Payment provider' })
  provider: string;

  @ApiProperty({ description: 'Payment status' })
  status: string;

  @ApiProperty({ description: 'Amount in cents' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Captured amount' })
  capturedAmount: number;

  @ApiProperty({ description: 'Refunded amount' })
  refundedAmount: number;

  @ApiProperty({ description: 'Payment creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Capture date' })
  capturedAt?: Date;

  @ApiProperty({ description: 'Refunds for this payment', type: [RefundResponseDto] })
  refunds: RefundResponseDto[];
}

export class UserPaymentsResponseDto {
  @ApiProperty({ description: 'List of payments', type: [UserPaymentItemDto] })
  payments: UserPaymentItemDto[];

  @ApiProperty({ description: 'Total number of payments' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}
