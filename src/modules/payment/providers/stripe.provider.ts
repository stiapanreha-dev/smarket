import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentProvider,
  CreatePaymentParams,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  PaymentStatus,
  PaymentProviderError,
  WebhookEvent,
  PaymentIntentStatus,
  RefundResultStatus,
} from '../interfaces/payment-provider.interface';

// Mock Stripe types (in production, install @types/stripe)
interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion: string;
}

@Injectable()
export class StripeProvider implements PaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  private readonly config: StripeConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      secretKey: this.configService.get<string>('STRIPE_SECRET_KEY', ''),
      webhookSecret: this.configService.get<string>('STRIPE_WEBHOOK_SECRET', ''),
      apiVersion: '2023-10-16',
    };
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      this.logger.debug(`Creating Stripe payment intent for order ${params.orderId}`);

      // In production, use actual Stripe SDK
      // const stripe = new Stripe(this.config.secretKey, { apiVersion: this.config.apiVersion });
      // const intent = await stripe.paymentIntents.create({ ... });

      // Mock implementation
      const intentId = `pi_${this.generateId()}`;
      const clientSecret = `${intentId}_secret_${this.generateId()}`;

      return {
        id: intentId,
        clientSecret,
        amount: params.amount,
        currency: params.currency.toLowerCase(),
        status: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
        requiresAction: false,
        metadata: {
          orderId: params.orderId,
          merchantIds: params.merchantIds.join(','),
        },
      };
    } catch (error) {
      throw new PaymentProviderError(
        'Stripe',
        error.message || 'Failed to create payment intent',
        error.code,
        error.statusCode,
      );
    }
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      this.logger.debug(`Capturing Stripe payment ${paymentIntentId}`);

      // In production:
      // const intent = await stripe.paymentIntents.capture(paymentIntentId, amount ? { amount_to_capture: amount } : undefined);

      // Mock implementation
      return {
        success: true,
        transactionId: paymentIntentId,
        amount: amount || 0,
        status: PaymentIntentStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'Stripe',
        error.message || 'Failed to capture payment',
        error.code,
      );
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount: number,
    reason?: string,
  ): Promise<RefundResult> {
    try {
      this.logger.debug(`Refunding Stripe payment ${paymentIntentId}, amount: ${amount}`);

      // In production:
      // const refund = await stripe.refunds.create({ payment_intent: paymentIntentId, amount, reason });

      // Mock implementation
      return {
        success: true,
        refundId: `re_${this.generateId()}`,
        amount,
        status: RefundResultStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'Stripe',
        error.message || 'Failed to refund payment',
        error.code,
      );
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      this.logger.debug(`Getting Stripe payment status for ${paymentIntentId}`);

      // In production:
      // const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Mock implementation
      return {
        id: paymentIntentId,
        status: PaymentIntentStatus.SUCCEEDED,
        amount: 10000,
        currency: 'usd',
        capturedAmount: 10000,
        refundedAmount: 0,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'Stripe',
        error.message || 'Failed to get payment status',
        error.code,
      );
    }
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      this.logger.debug(`Cancelling Stripe payment ${paymentIntentId}`);

      // In production:
      // const intent = await stripe.paymentIntents.cancel(paymentIntentId);

      return {
        success: true,
        transactionId: paymentIntentId,
        amount: 0,
        status: PaymentIntentStatus.CANCELLED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'Stripe',
        error.message || 'Failed to cancel payment',
        error.code,
      );
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // In production:
      // const event = stripe.webhooks.constructEvent(payload, signature, this.config.webhookSecret);
      // return true;

      // Mock implementation
      return signature.startsWith('t=');
    } catch (error) {
      this.logger.error(`Stripe webhook signature verification failed: ${error.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    // In production, parse actual Stripe event
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

    return {
      id: event.id || `evt_${this.generateId()}`,
      type: event.type || 'payment_intent.succeeded',
      paymentIntentId: event.data?.object?.id,
      data: event.data,
      createdAt: new Date(event.created * 1000 || Date.now()),
    };
  }

  private getPaymentMethods(currency: string): string[] {
    const methods: Record<string, string[]> = {
      USD: ['card', 'apple_pay', 'google_pay'],
      AED: ['card', 'apple_pay', 'google_pay'],
      EUR: ['card', 'apple_pay', 'google_pay', 'sepa_debit'],
      RUB: ['card'], // Limited in Russia
    };
    return methods[currency.toUpperCase()] || ['card'];
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
