export interface CreatePaymentParams {
  amount: number; // Amount in minor units (cents)
  currency: string; // ISO currency code (USD, EUR, RUB, AED)
  orderId: string;
  userId?: string;
  customerEmail?: string;
  customerPhone?: string;
  merchantIds: string[];
  returnUrl?: string;
  paymentMethod?: string;
  items?: PaymentItem[];
  metadata?: Record<string, any>;
}

export interface PaymentItem {
  name: string;
  price: number; // In minor units
  quantity: number;
  type: 'physical' | 'digital' | 'service';
}

export interface PaymentIntent {
  id: string; // Provider's payment intent ID
  clientSecret?: string; // For client-side confirmation (Stripe)
  confirmationUrl?: string; // For redirect-based flows (YooKassa)
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  requiresAction?: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export enum PaymentIntentStatus {
  PENDING = 'pending',
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  AUTHORIZED = 'authorized',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  amount: number;
  status: PaymentIntentStatus;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: RefundResultStatus;
  errorMessage?: string;
}

export enum RefundResultStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PaymentStatus {
  id: string;
  status: PaymentIntentStatus;
  amount: number;
  currency: string;
  capturedAmount?: number;
  refundedAmount?: number;
  metadata?: Record<string, any>;
}

export interface PaymentProviderConfig {
  apiKey: string;
  secretKey?: string;
  webhookSecret?: string;
  environment?: 'test' | 'production';
  [key: string]: any;
}

export interface PaymentProvider {
  /**
   * Create a payment intent (authorize)
   */
  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>;

  /**
   * Capture a previously authorized payment
   */
  capturePayment(paymentIntentId: string, amount?: number): Promise<PaymentResult>;

  /**
   * Refund a captured payment
   */
  refundPayment(paymentIntentId: string, amount: number, reason?: string): Promise<RefundResult>;

  /**
   * Get payment status from provider
   */
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus>;

  /**
   * Cancel/void a payment intent before capture
   */
  cancelPayment?(paymentIntentId: string): Promise<PaymentResult>;

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: any, signature: string): boolean;

  /**
   * Parse webhook event
   */
  parseWebhookEvent(payload: any): WebhookEvent;
}

export interface WebhookEvent {
  id: string;
  type: string;
  paymentIntentId?: string;
  data: any;
  createdAt: Date;
}

export class PaymentProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
    public code?: string,
    public statusCode?: number,
  ) {
    super(`[${provider}] ${message}`);
    this.name = 'PaymentProviderError';
  }
}
