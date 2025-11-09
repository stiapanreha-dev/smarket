import {
  PaymentProvider,
  PaymentIntent,
  PaymentResult,
  RefundResult,
  PaymentStatus,
  PaymentIntentStatus,
  RefundResultStatus,
  WebhookEvent,
  CreatePaymentParams,
} from '../../src/modules/payment/interfaces/payment-provider.interface';

/**
 * Mock Stripe Provider for testing
 */
export class MockStripeProvider implements PaymentProvider {
  public createPaymentIntentCalls: any[] = [];
  public capturePaymentCalls: any[] = [];
  public refundPaymentCalls: any[] = [];

  async createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent> {
    this.createPaymentIntentCalls.push(params);

    return {
      id: `pi_test_${Date.now()}`,
      status: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
      amount: params.amount,
      currency: params.currency,
      requiresAction: false,
      actionUrl: null,
      clientSecret: `pi_test_secret_${Date.now()}`,
    };
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    this.capturePaymentCalls.push({ paymentIntentId, amount });

    return {
      success: true,
      transactionId: paymentIntentId,
      amount: amount || 0,
      status: PaymentIntentStatus.SUCCEEDED,
    };
  }

  async refundPayment(
    paymentIntentId: string,
    amount: number,
    reason?: string,
  ): Promise<RefundResult> {
    this.refundPaymentCalls.push({ paymentIntentId, amount, reason });

    return {
      success: true,
      refundId: `re_test_${Date.now()}`,
      amount,
      status: RefundResultStatus.SUCCEEDED,
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: paymentIntentId,
      amount: 0,
      status: PaymentIntentStatus.CANCELLED,
    };
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    return {
      id: paymentIntentId,
      status: PaymentIntentStatus.SUCCEEDED,
      amount: 1000,
      currency: 'usd',
    };
  }

  verifyWebhookSignature(_payload: any, _signature: string): boolean {
    return true;
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
      paymentIntentId: 'pi_test_123',
      data: payload,
      createdAt: new Date(),
    };
  }

  reset() {
    this.createPaymentIntentCalls = [];
    this.capturePaymentCalls = [];
    this.refundPaymentCalls = [];
  }
}

/**
 * Mock Stripe Provider with failure scenarios
 */
export class MockStripeProviderWithFailures extends MockStripeProvider {
  private shouldFailCapture = false;
  private shouldFailRefund = false;

  setFailCapture(fail: boolean) {
    this.shouldFailCapture = fail;
  }

  setFailRefund(fail: boolean) {
    this.shouldFailRefund = fail;
  }

  async capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    this.capturePaymentCalls.push({ paymentIntentId, amount });

    if (this.shouldFailCapture) {
      return {
        success: false,
        transactionId: paymentIntentId,
        amount: 0,
        status: PaymentIntentStatus.FAILED,
        errorMessage: 'Card declined',
      };
    }

    return {
      success: true,
      transactionId: paymentIntentId,
      amount: amount || 0,
      status: PaymentIntentStatus.SUCCEEDED,
    };
  }

  async refundPayment(
    paymentIntentId: string,
    amount: number,
    reason?: string,
  ): Promise<RefundResult> {
    this.refundPaymentCalls.push({ paymentIntentId, amount, reason });

    if (this.shouldFailRefund) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: RefundResultStatus.FAILED,
        errorMessage: 'Refund failed',
      };
    }

    return {
      success: true,
      refundId: `re_test_${Date.now()}`,
      amount,
      status: RefundResultStatus.SUCCEEDED,
    };
  }
}

/**
 * Factory function to create mock Stripe provider
 */
export const createMockStripeProvider = (): MockStripeProvider => {
  return new MockStripeProvider();
};

/**
 * Factory function to create mock Stripe provider with failures
 */
export const createMockStripeProviderWithFailures = (): MockStripeProviderWithFailures => {
  return new MockStripeProviderWithFailures();
};
