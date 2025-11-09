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

interface NetworkIntlConfig {
  apiKey: string;
  outletId: string;
  secretKey: string;
}

@Injectable()
export class NetworkIntlProvider implements PaymentProvider {
  private readonly logger = new Logger(NetworkIntlProvider.name);
  private readonly config: NetworkIntlConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      apiKey: this.configService.get<string>('NETWORK_INTL_API_KEY', ''),
      outletId: this.configService.get<string>('NETWORK_INTL_OUTLET_ID', ''),
      secretKey: this.configService.get<string>('NETWORK_INTL_SECRET_KEY', ''),
    };
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      this.logger.debug(
        `Creating Network International payment intent for order ${params.orderId}`,
      );

      // In production, use Network International Payment Gateway API
      // Mock implementation for UAE payments
      const orderId = `ni_${this.generateId()}`;
      const paymentUrl = `https://ngenius-gateway.com/checkout/${orderId}`;

      return {
        id: orderId,
        confirmationUrl: paymentUrl,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        status: PaymentIntentStatus.PENDING,
        requiresAction: true,
        actionUrl: paymentUrl,
        metadata: {
          orderId: params.orderId,
          outletId: this.config.outletId,
        },
      };
    } catch (error) {
      throw new PaymentProviderError(
        'NetworkIntl',
        error.message || 'Failed to create payment intent',
        error.code,
      );
    }
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      this.logger.debug(`Capturing Network International payment ${paymentIntentId}`);

      // In production:
      // const result = await this.client.capturePayment(paymentIntentId, amount);

      return {
        success: true,
        transactionId: paymentIntentId,
        amount: amount || 0,
        status: PaymentIntentStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'NetworkIntl',
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
      this.logger.debug(
        `Refunding Network International payment ${paymentIntentId}, amount: ${amount}`,
      );

      // In production:
      // const refund = await this.client.refundPayment(paymentIntentId, amount);

      return {
        success: true,
        refundId: `ni_refund_${this.generateId()}`,
        amount,
        status: RefundResultStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'NetworkIntl',
        error.message || 'Failed to refund payment',
        error.code,
      );
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      this.logger.debug(`Getting Network International payment status for ${paymentIntentId}`);

      // In production:
      // const order = await this.client.getOrder(paymentIntentId);

      return {
        id: paymentIntentId,
        status: PaymentIntentStatus.SUCCEEDED,
        amount: 10000,
        currency: 'AED',
        capturedAmount: 10000,
        refundedAmount: 0,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'NetworkIntl',
        error.message || 'Failed to get payment status',
        error.code,
      );
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // In production, verify Network International webhook signature
      // They use HMAC-SHA256 signature
      return true; // Simplified for mock
    } catch (error) {
      this.logger.error(`Network International webhook verification failed: ${error.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

    return {
      id: event._id || `ni_evt_${this.generateId()}`,
      type: event.eventName || 'payment.captured',
      paymentIntentId: event.order?.reference,
      data: event,
      createdAt: new Date(event.eventTime || Date.now()),
    };
  }

  private generateId(): string {
    return (
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    );
  }
}
