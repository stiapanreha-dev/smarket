import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentSplitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  merchantId: string;

  @ApiProperty()
  grossAmount: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  processingFee: number;

  @ApiProperty()
  netAmount: number;

  @ApiProperty()
  status: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  provider: string;

  @ApiPropertyOptional()
  providerPaymentId?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  authorizedAmount?: number;

  @ApiProperty()
  capturedAmount: number;

  @ApiProperty()
  refundedAmount: number;

  @ApiProperty()
  platformFee: number;

  @ApiProperty()
  requiresAction: boolean;

  @ApiPropertyOptional()
  actionUrl?: string;

  @ApiProperty({ type: [PaymentSplitResponseDto] })
  splits: PaymentSplitResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RefundResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  reason: string;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  processedAt?: Date;
}
