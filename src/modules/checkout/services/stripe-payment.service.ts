/**
 * Stripe Payment Service
 *
 * Handles Stripe payment processing:
 * - Create Payment Intent
 * - Confirm payments
 * - Refunds
 * - Payment method management
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { stripeConfig } from '@config/stripe.config';

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private readonly stripe: Stripe;

  constructor() {
    if (!stripeConfig.secretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY is not set. Stripe functionality will not work. ' +
        'Please add it to your .env file. Get your key from: https://dashboard.stripe.com/test/apikeys'
      );
    }

    this.stripe = new Stripe(stripeConfig.secretKey, {
      apiVersion: stripeConfig.apiVersion,
    });
  }

  /**
   * Create a Payment Intent
   *
   * @param amount - Amount in cents (e.g., 1000 = $10.00)
   * @param currency - Currency code (e.g., 'usd')
   * @param metadata - Additional metadata
   * @returns Stripe Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string> = {},
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Creating payment intent for ${amount} ${currency}`);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: currency.toLowerCase(),
        payment_method_types: [...stripeConfig.paymentMethodTypes],
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.log(`Payment intent created: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to create payment intent:', error);
      throw new BadRequestException(
        `Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Retrieve a Payment Intent
   *
   * @param paymentIntentId - Stripe Payment Intent ID
   * @returns Stripe Payment Intent
   */
  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException(
        `Failed to retrieve payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update a Payment Intent
   *
   * @param paymentIntentId - Stripe Payment Intent ID
   * @param params - Update parameters
   * @returns Updated Stripe Payment Intent
   */
  async updatePaymentIntent(
    paymentIntentId: string,
    params: Stripe.PaymentIntentUpdateParams,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Updating payment intent ${paymentIntentId}`);

      return await this.stripe.paymentIntents.update(paymentIntentId, params);
    } catch (error) {
      this.logger.error(`Failed to update payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException(
        `Failed to update payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Cancel a Payment Intent
   *
   * @param paymentIntentId - Stripe Payment Intent ID
   * @returns Cancelled Stripe Payment Intent
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Cancelling payment intent ${paymentIntentId}`);

      return await this.stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to cancel payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException(
        `Failed to cancel payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Confirm a Payment Intent
   *
   * @param paymentIntentId - Stripe Payment Intent ID
   * @param paymentMethodId - Stripe Payment Method ID
   * @returns Confirmed Stripe Payment Intent
   */
  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      this.logger.log(`Confirming payment intent ${paymentIntentId}`);

      return await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent ${paymentIntentId}:`, error);
      throw new BadRequestException(
        `Failed to confirm payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Create a Refund
   *
   * @param paymentIntentId - Stripe Payment Intent ID
   * @param amount - Amount to refund in cents (optional, full refund if not provided)
   * @param reason - Refund reason
   * @returns Stripe Refund
   */
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason,
  ): Promise<Stripe.Refund> {
    try {
      this.logger.log(`Creating refund for payment intent ${paymentIntentId}`);

      const params: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        params.amount = amount;
      }

      if (reason) {
        params.reason = reason;
      }

      return await this.stripe.refunds.create(params);
    } catch (error) {
      this.logger.error(`Failed to create refund for ${paymentIntentId}:`, error);
      throw new BadRequestException(
        `Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Retrieve a Payment Method
   *
   * @param paymentMethodId - Stripe Payment Method ID
   * @returns Stripe Payment Method
   */
  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment method ${paymentMethodId}:`, error);
      throw new BadRequestException(
        `Failed to retrieve payment method: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Verify webhook signature
   *
   * @param payload - Request body
   * @param signature - Stripe signature header
   * @returns Stripe Event
   */
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret,
      );
    } catch (error) {
      this.logger.error('Failed to verify webhook signature:', error);
      throw new BadRequestException(
        `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
