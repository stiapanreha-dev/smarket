import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { PaymentService } from '../services/payment.service';
import { WebhookService } from '../services/webhook.service';
import { AuthorizePaymentDto } from '../dto/authorize-payment.dto';
import { RefundPaymentDto } from '../dto/refund-payment.dto';
import { PaymentResponseDto, RefundResponseDto } from '../dto/payment-response.dto';
import {
  GetUserPaymentsDto,
  UserPaymentsResponseDto,
  UserPaymentItemDto,
} from '../dto/user-payments.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Get current user's payment history
   */
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment history for current user',
    description: 'Returns paginated list of payments for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
    type: UserPaymentsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  async getMyPayments(
    @CurrentUser('id') userId: string,
    @Query() query: GetUserPaymentsDto,
  ): Promise<UserPaymentsResponseDto> {
    const result = await this.paymentService.getUserPayments(userId, {
      page: query.page,
      limit: query.limit,
    });

    const payments: UserPaymentItemDto[] = result.payments.map((payment) => ({
      id: payment.id,
      orderId: payment.order_id,
      orderNumber: payment.order?.order_number,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount_minor,
      currency: payment.currency,
      capturedAmount: payment.captured_amount,
      refundedAmount: payment.refunded_amount,
      createdAt: payment.created_at,
      capturedAt: payment.captured_at || undefined,
      refunds: (payment.refunds || []).map((refund) => ({
        id: refund.id,
        paymentId: refund.payment_id,
        amount: refund.amount_minor,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        createdAt: refund.created_at,
        processedAt: refund.processed_at || undefined,
      })),
    }));

    return {
      payments,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Post('authorize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Authorize payment for order' })
  @ApiResponse({ status: 201, description: 'Payment authorized', type: PaymentResponseDto })
  async authorizePayment(@Body() dto: AuthorizePaymentDto): Promise<any> {
    const payment = await this.paymentService.authorizePayment(dto.orderId, dto.idempotencyKey);

    return this.mapPaymentToResponse(payment);
  }

  @Post(':id/capture')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Capture authorized payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment captured', type: PaymentResponseDto })
  async capturePayment(@Param('id') paymentId: string): Promise<any> {
    const payment = await this.paymentService.capturePayment(paymentId);
    return this.mapPaymentToResponse(payment);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund payment' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Refund processed', type: RefundResponseDto })
  async refundPayment(
    @Param('id') paymentId: string,
    @Body() dto: RefundPaymentDto,
    @Request() req: any,
  ): Promise<any> {
    const refund = await this.paymentService.refundPayment(
      paymentId,
      dto.amount,
      dto.reason,
      dto.lineItemId,
      req.user?.id,
    );

    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount_minor,
      currency: refund.currency,
      status: refund.status,
      reason: refund.reason,
      createdAt: refund.created_at,
      processedAt: refund.processed_at,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ status: 200, description: 'Payment details', type: PaymentResponseDto })
  async getPayment(@Param('id') paymentId: string): Promise<any> {
    const payment = await this.paymentService.getPayment(paymentId);
    return this.mapPaymentToResponse(payment);
  }

  @Get('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by order ID' })
  @ApiParam({ name: 'orderId', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Payment details', type: PaymentResponseDto })
  async getPaymentByOrderId(@Param('orderId') orderId: string): Promise<any> {
    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    return payment ? this.mapPaymentToResponse(payment) : null;
  }

  private mapPaymentToResponse(payment: any): PaymentResponseDto {
    return {
      id: payment.id,
      orderId: payment.order_id,
      provider: payment.provider,
      providerPaymentId: payment.provider_payment_id,
      status: payment.status,
      amount: payment.amount_minor,
      currency: payment.currency,
      authorizedAmount: payment.authorized_amount,
      capturedAmount: payment.captured_amount,
      refundedAmount: payment.refunded_amount,
      platformFee: payment.platform_fee,
      requiresAction: payment.requires_action,
      actionUrl: payment.action_url,
      splits: (payment.splits || []).map((split: any) => ({
        id: split.id,
        merchantId: split.merchant_id,
        grossAmount: split.gross_amount,
        platformFee: split.platform_fee,
        processingFee: split.processing_fee,
        netAmount: split.net_amount,
        status: split.status,
      })),
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
    };
  }
}
