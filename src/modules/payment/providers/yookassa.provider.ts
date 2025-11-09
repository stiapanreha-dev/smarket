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

interface YooKassaConfig {
  shopId: string;
  secretKey: string;
}

@Injectable()
export class YooKassaProvider implements PaymentProvider {
  private readonly logger = new Logger(YooKassaProvider.name);
  private readonly config: YooKassaConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      shopId: this.configService.get<string>('YOOKASSA_SHOP_ID', ''),
      secretKey: this.configService.get<string>('YOOKASSA_SECRET_KEY', ''),
    };
  }

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    try {
      this.logger.debug(`Creating YooKassa payment intent for order ${params.orderId}`);

      // In production, use YooKassa SDK
      // const payment = await this.client.createPayment({ ... });

      // Mock implementation
      const paymentId = `yoo_${this.generateId()}`;
      const confirmationUrl = `https://yookassa.ru/checkout/${paymentId}`;

      return {
        id: paymentId,
        confirmationUrl,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        status: PaymentIntentStatus.PENDING,
        requiresAction: true,
        actionUrl: confirmationUrl,
        metadata: {
          orderId: params.orderId,
          fiscalized: true, // YooKassa requires fiscalization for Russia
        },
      };
    } catch (error) {
      throw new PaymentProviderError(
        'YooKassa',
        error.message || 'Failed to create payment intent',
        error.code,
      );
    }
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      this.logger.debug(`Capturing YooKassa payment ${paymentIntentId}`);

      // In production:
      // const payment = await this.client.capturePayment(paymentIntentId, { amount: { value: ... } });

      return {
        success: true,
        transactionId: paymentIntentId,
        amount: amount || 0,
        status: PaymentIntentStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'YooKassa',
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
      this.logger.debug(`Refunding YooKassa payment ${paymentIntentId}, amount: ${amount}`);

      // In production:
      // const refund = await this.client.createRefund({ payment_id: paymentIntentId, amount: { value: ... } });

      return {
        success: true,
        refundId: `yoo_refund_${this.generateId()}`,
        amount,
        status: RefundResultStatus.SUCCEEDED,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'YooKassa',
        error.message || 'Failed to refund payment',
        error.code,
      );
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      this.logger.debug(`Getting YooKassa payment status for ${paymentIntentId}`);

      // In production:
      // const payment = await this.client.getPayment(paymentIntentId);

      return {
        id: paymentIntentId,
        status: PaymentIntentStatus.SUCCEEDED,
        amount: 10000,
        currency: 'RUB',
        capturedAmount: 10000,
        refundedAmount: 0,
      };
    } catch (error) {
      throw new PaymentProviderError(
        'YooKassa',
        error.message || 'Failed to get payment status',
        error.code,
      );
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // In production, verify YooKassa webhook signature
      // YooKassa uses IP whitelist, not signature verification
      return true; // Simplified for mock
    } catch (error) {
      this.logger.error(`YooKassa webhook verification failed: ${error.message}`);
      return false;
    }
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

    return {
      id: event.event || `yoo_evt_${this.generateId()}`,
      type: event.type || event.event,
      paymentIntentId: event.object?.id,
      data: event.object,
      createdAt: new Date(),
    };
  }

  /**
   * Create receipt for Russian fiscalization
   */
  private createReceipt(params: CreatePaymentParams): any {
    if (!params.items || params.items.length === 0) {
      return null;
    }

    return {
      customer: {
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      items: params.items.map((item) => ({
        description: item.name,
        amount: {
          value: (item.price / 100).toFixed(2),
          currency: params.currency.toUpperCase(),
        },
        vat_code: this.getVatCode(item.type),
        quantity: item.quantity,
        payment_subject: this.getPaymentSubject(item.type),
        payment_mode: 'full_payment',
      })),
    };
  }

  private getVatCode(itemType: string): number {
    // Russian VAT codes
    const vatCodes: Record<string, number> = {
      physical: 4, // VAT 20%
      digital: 4, // VAT 20%
      service: 4, // VAT 20%
    };
    return vatCodes[itemType] || 4;
  }

  private getPaymentSubject(itemType: string): string {
    const subjects: Record<string, string> = {
      physical: 'commodity',
      digital: 'payment',
      service: 'service',
    };
    return subjects[itemType] || 'commodity';
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }
}
