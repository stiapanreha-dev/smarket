/**
 * Webhooks Controller
 *
 * Handles webhook events from payment providers (Stripe)
 * - Verifies webhook signatures
 * - Processes payment events
 * - Updates order status
 */

import {
  Controller,
  Post,
  Headers,
  RawBodyRequest,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { StripePaymentService } from '../checkout/services/stripe-payment.service';
import { CheckoutService } from '../checkout/checkout.service';
import type { Request } from 'express';
import Stripe from 'stripe';

@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly stripeService: StripePaymentService,
    private readonly checkoutService: CheckoutService,
  ) {}

  /**
   * POST /api/v1/webhooks/stripe
   * Handle Stripe webhook events
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      this.logger.error('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    // Get raw body for signature verification
    const rawBody = request.rawBody;
    if (!rawBody) {
      this.logger.error('Missing raw body');
      throw new BadRequestException('Missing request body');
    }

    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(rawBody, signature);

      this.logger.log(`Received Stripe webhook: ${event.type} (${event.id})`);

      // Process event based on type
      await this.processStripeEvent(event);

      return { received: true };
    } catch (error) {
      this.logger.error('Failed to process webhook:', error);
      throw new BadRequestException(
        `Webhook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process Stripe event based on type
   */
  private async processStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);

    const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;
    if (!checkoutSessionId) {
      this.logger.warn(`No checkout_session_id in payment intent metadata: ${paymentIntent.id}`);
      return;
    }

    try {
      // Complete checkout and create order
      await this.checkoutService.completeCheckout(checkoutSessionId, null, {
        payment_intent_id: paymentIntent.id,
      });

      this.logger.log(`Order created successfully for checkout session: ${checkoutSessionId}`);
    } catch (error) {
      this.logger.error(`Failed to complete checkout for session ${checkoutSessionId}:`, error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.error(`Payment failed: ${paymentIntent.id}`);
    this.logger.error(`Failure reason: ${paymentIntent.last_payment_error?.message}`);

    const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;
    if (!checkoutSessionId) {
      this.logger.warn(`No checkout_session_id in payment intent metadata: ${paymentIntent.id}`);
      return;
    }

    // TODO: Mark checkout session as failed
    // TODO: Notify user about payment failure
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment canceled: ${paymentIntent.id}`);

    const checkoutSessionId = paymentIntent.metadata?.checkout_session_id;
    if (!checkoutSessionId) {
      this.logger.warn(`No checkout_session_id in payment intent metadata: ${paymentIntent.id}`);
      return;
    }

    // TODO: Cancel checkout session
    // TODO: Release inventory reservations
  }

  /**
   * Handle charge refund
   */
  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Charge refunded: ${charge.id}`);
    this.logger.log(`Amount refunded: ${charge.amount_refunded} ${charge.currency}`);

    // TODO: Update order status to REFUNDED
    // TODO: Notify merchant and customer
  }
}
