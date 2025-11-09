import { PaymentProvider, PaymentIntentResponse } from '../../src/modules/payment/interfaces/payment-provider.interface';

/**
 * Mock Stripe Provider for testing
 */
export class MockStripeProvider implements PaymentProvider {
  public createPaymentIntentCalls: any[] = [];
  public capturePaymentCalls: any[] = [];
  public refundPaymentCalls: any[] = [];

  async createPaymentIntent(params: any): Promise<PaymentIntentResponse> {
    this.createPaymentIntentCalls.push(params);

    return {
      id: `pi_test_${Date.now()}`,
      status: 'requires_payment_method',
      amount: params.amount,
      currency: params.currency,
      requiresAction: false,
      actionUrl: null,
      clientSecret: `pi_test_secret_${Date.now()}`,
    };
  }

  async capturePayment(paymentIntentId: string, amount: number): Promise<{ success: boolean; amount: number; errorMessage?: string }> {
    this.capturePaymentCalls.push({ paymentIntentId, amount });

    return {
      success: true,
      amount,
    };
  }

  async refundPayment(paymentIntentId: string, amount: number, reason: string): Promise<{ success: boolean; refundId: string; errorMessage?: string }> {
    this.refundPaymentCalls.push({ paymentIntentId, amount, reason });

    return {
      success: true,
      refundId: `re_test_${Date.now()}`,
    };
  }

  async cancelPayment(paymentIntentId: string): Promise<{ success: boolean; errorMessage?: string }> {
    return {
      success: true,
    };
  }

  async getPaymentStatus(paymentIntentId: string): Promise<string> {
    return 'succeeded';
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

  async capturePayment(paymentIntentId: string, amount: number): Promise<{ success: boolean; amount: number; errorMessage?: string }> {
    this.capturePaymentCalls.push({ paymentIntentId, amount });

    if (this.shouldFailCapture) {
      return {
        success: false,
        amount: 0,
        errorMessage: 'Card declined',
      };
    }

    return {
      success: true,
      amount,
    };
  }

  async refundPayment(paymentIntentId: string, amount: number, reason: string): Promise<{ success: boolean; refundId: string; errorMessage?: string }> {
    this.refundPaymentCalls.push({ paymentIntentId, amount, reason });

    if (this.shouldFailRefund) {
      return {
        success: false,
        refundId: '',
        errorMessage: 'Refund failed',
      };
    }

    return {
      success: true,
      refundId: `re_test_${Date.now()}`,
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
