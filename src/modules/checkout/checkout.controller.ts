import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CheckoutService } from './checkout.service';
import {
  CreateCheckoutSessionDto,
  UpdateShippingAddressDto,
  UpdateDeliveryMethodDto,
  UpdatePaymentMethodDto,
  ApplyPromoCodeDto,
  CompleteCheckoutDto,
  CompleteCheckoutResponseDto,
  CreatePaymentIntentDto,
} from './dto';
import { CheckoutSession, DeliveryOption } from '../../database/entities/checkout-session.entity';

@Controller('api/v1/checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /api/v1/checkout/sessions
   * Create a new checkout session
   */
  @Post('sessions')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Request() req: any,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Creating checkout session for ${userId ? `user ${userId}` : 'guest'}`);

    return await this.checkoutService.createSession(userId, dto);
  }

  /**
   * GET /api/v1/checkout/sessions/:id
   * Get checkout session details
   */
  @Get('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getSession(@Request() req: any, @Param('id') sessionId: string): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    return await this.checkoutService.getSession(sessionId, userId);
  }

  /**
   * PUT /api/v1/checkout/sessions/:id/shipping
   * Update shipping address
   */
  @Put('sessions/:id/shipping')
  @UseGuards(OptionalJwtAuthGuard)
  async updateShippingAddress(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: UpdateShippingAddressDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Updating shipping address for session ${sessionId}`);

    return await this.checkoutService.updateShippingAddress(sessionId, userId, dto);
  }

  /**
   * GET /api/v1/checkout/sessions/:id/delivery-options
   * Get available delivery options
   */
  @Get('sessions/:id/delivery-options')
  @UseGuards(OptionalJwtAuthGuard)
  async getDeliveryOptions(
    @Request() req: any,
    @Param('id') sessionId: string,
  ): Promise<DeliveryOption[]> {
    const userId = req.user?.userId;

    this.logger.log(`Getting delivery options for session ${sessionId}`);

    return await this.checkoutService.getDeliveryOptions(sessionId, userId);
  }

  /**
   * PUT /api/v1/checkout/sessions/:id/delivery
   * Update delivery method
   */
  @Put('sessions/:id/delivery')
  @UseGuards(OptionalJwtAuthGuard)
  async updateDeliveryMethod(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: UpdateDeliveryMethodDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Updating delivery method for session ${sessionId}`);

    return await this.checkoutService.updateDeliveryMethod(sessionId, userId, dto);
  }

  /**
   * PUT /api/v1/checkout/sessions/:id/payment-method
   * Update payment method
   */
  @Put('sessions/:id/payment-method')
  @UseGuards(OptionalJwtAuthGuard)
  async updatePaymentMethod(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Updating payment method for session ${sessionId}`);

    return await this.checkoutService.updatePaymentMethod(sessionId, userId, dto);
  }

  /**
   * POST /api/v1/checkout/sessions/:id/payment-intent
   * Create a Stripe Payment Intent for the checkout session
   */
  @Post('sessions/:id/payment-intent')
  @UseGuards(OptionalJwtAuthGuard)
  async createPaymentIntent(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: CreatePaymentIntentDto,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const userId = req.user?.userId;

    this.logger.log(`Creating payment intent for session ${sessionId}`);

    return await this.checkoutService.createPaymentIntent(sessionId, userId, dto);
  }

  /**
   * POST /api/v1/checkout/sessions/:id/apply-promo
   * Apply promo code
   */
  @Post('sessions/:id/apply-promo')
  @UseGuards(OptionalJwtAuthGuard)
  async applyPromoCode(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: ApplyPromoCodeDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Applying promo code ${dto.code} to session ${sessionId}`);

    return await this.checkoutService.applyPromoCode(sessionId, userId, dto);
  }

  /**
   * POST /api/v1/checkout/sessions/:id/complete
   * Complete checkout and create order
   */
  @Post('sessions/:id/complete')
  @UseGuards(OptionalJwtAuthGuard)
  async completeCheckout(
    @Request() req: any,
    @Param('id') sessionId: string,
    @Body() dto: CompleteCheckoutDto,
  ): Promise<CompleteCheckoutResponseDto> {
    const userId = req.user?.userId;

    this.logger.log(`Completing checkout for session ${sessionId}`);

    const session = await this.checkoutService.completeCheckout(sessionId, userId, dto);

    return {
      order_id: session.order_id!,
      order_number: session.order_number!,
      status: session.status,
    };
  }

  /**
   * DELETE /api/v1/checkout/sessions/:id
   * Cancel checkout session
   */
  @Delete('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelSession(@Request() req: any, @Param('id') sessionId: string): Promise<void> {
    const userId = req.user?.userId;

    this.logger.log(`Cancelling checkout session ${sessionId}`);

    await this.checkoutService.cancelSession(sessionId, userId);
  }
}
