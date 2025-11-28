import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import Stripe from 'stripe';

// Mock Stripe SDK
jest.mock('stripe');

// Mock stripe config
jest.mock('@config/stripe.config', () => ({
  stripeConfig: {
    secretKey: 'sk_test_mock_key',
    apiVersion: '2025-10-29.clover',
    webhookSecret: 'whsec_test_secret',
    defaultCurrency: 'usd',
    paymentMethodTypes: ['card'],
  },
}));

describe('StripePaymentService', () => {
  let service: StripePaymentService;
  let mockStripe: jest.Mocked<Stripe>;

  // Mock Stripe methods
  const mockPaymentIntents = {
    create: jest.fn(),
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
    confirm: jest.fn(),
  };

  const mockRefunds = {
    create: jest.fn(),
  };

  const mockPaymentMethods = {
    retrieve: jest.fn(),
  };

  const mockWebhooks = {
    constructEvent: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup Stripe mock
    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () =>
        ({
          paymentIntents: mockPaymentIntents,
          refunds: mockRefunds,
          paymentMethods: mockPaymentMethods,
          webhooks: mockWebhooks,
        }) as unknown as Stripe,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [StripePaymentService],
    }).compile();

    service = module.get<StripePaymentService>(StripePaymentService);
    mockStripe = (service as any).stripe;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should initialize Stripe with correct config', () => {
      expect(Stripe).toHaveBeenCalledWith('sk_test_mock_key', {
        apiVersion: '2025-10-29.clover',
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const amount = 1000;
      const currency = 'USD';
      const metadata = { orderId: 'order-123', customerId: 'cust-123' };

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_123',
        amount,
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
        metadata,
      };

      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.createPaymentIntent(amount, currency, metadata);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    });

    it('should create payment intent without metadata', async () => {
      const amount = 2000;
      const currency = 'EUR';

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_456',
        amount,
        currency: currency.toLowerCase(),
        status: 'requires_payment_method',
      };

      mockPaymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.createPaymentIntent(amount, currency);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.create).toHaveBeenCalledWith({
        amount,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        metadata: {},
        automatic_payment_methods: {
          enabled: true,
        },
      });
    });

    it('should throw BadRequestException on Stripe error', async () => {
      const error = new Error('Invalid amount');
      mockPaymentIntents.create.mockRejectedValue(error);

      await expect(service.createPaymentIntent(1000, 'usd')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent(1000, 'usd')).rejects.toThrow(
        'Failed to create payment intent: Invalid amount',
      );
    });

    it('should handle unknown error type', async () => {
      mockPaymentIntents.create.mockRejectedValue('Unknown error string');

      await expect(service.createPaymentIntent(1000, 'usd')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createPaymentIntent(1000, 'usd')).rejects.toThrow(
        'Failed to create payment intent: Unknown error',
      );
    });
  });

  describe('retrievePaymentIntent', () => {
    it('should retrieve payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
      };

      mockPaymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.retrievePaymentIntent(paymentIntentId);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.retrieve).toHaveBeenCalledWith(paymentIntentId);
    });

    it('should throw BadRequestException when payment intent not found', async () => {
      const paymentIntentId = 'pi_invalid';
      const error = new Error('No such payment_intent');

      mockPaymentIntents.retrieve.mockRejectedValue(error);

      await expect(service.retrievePaymentIntent(paymentIntentId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.retrievePaymentIntent(paymentIntentId)).rejects.toThrow(
        'Failed to retrieve payment intent: No such payment_intent',
      );
    });

    it('should handle unknown error type', async () => {
      mockPaymentIntents.retrieve.mockRejectedValue({ message: 'Some error' });

      await expect(service.retrievePaymentIntent('pi_123')).rejects.toThrow(
        'Failed to retrieve payment intent: Unknown error',
      );
    });
  });

  describe('updatePaymentIntent', () => {
    it('should update payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const params: Stripe.PaymentIntentUpdateParams = {
        metadata: { orderId: 'order-456' },
        description: 'Updated order',
      };

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        amount: 1000,
        currency: 'usd',
        status: 'requires_payment_method',
        metadata: { orderId: 'order-456' },
        description: 'Updated order',
      };

      mockPaymentIntents.update.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.updatePaymentIntent(paymentIntentId, params);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.update).toHaveBeenCalledWith(paymentIntentId, params);
    });

    it('should throw BadRequestException on update error', async () => {
      const error = new Error('Cannot update payment intent');
      mockPaymentIntents.update.mockRejectedValue(error);

      await expect(service.updatePaymentIntent('pi_123', {})).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updatePaymentIntent('pi_123', {})).rejects.toThrow(
        'Failed to update payment intent: Cannot update payment intent',
      );
    });
  });

  describe('cancelPaymentIntent', () => {
    it('should cancel payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        amount: 1000,
        currency: 'usd',
        status: 'canceled',
      };

      mockPaymentIntents.cancel.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.cancelPaymentIntent(paymentIntentId);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.cancel).toHaveBeenCalledWith(paymentIntentId);
    });

    it('should throw BadRequestException on cancel error', async () => {
      const error = new Error('Cannot cancel payment intent');
      mockPaymentIntents.cancel.mockRejectedValue(error);

      await expect(service.cancelPaymentIntent('pi_123')).rejects.toThrow(BadRequestException);
      await expect(service.cancelPaymentIntent('pi_123')).rejects.toThrow(
        'Failed to cancel payment intent: Cannot cancel payment intent',
      );
    });

    it('should handle unknown error type', async () => {
      mockPaymentIntents.cancel.mockRejectedValue(null);

      await expect(service.cancelPaymentIntent('pi_123')).rejects.toThrow(
        'Failed to cancel payment intent: Unknown error',
      );
    });
  });

  describe('confirmPaymentIntent', () => {
    it('should confirm payment intent successfully', async () => {
      const paymentIntentId = 'pi_123';
      const paymentMethodId = 'pm_card_visa';

      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: paymentIntentId,
        amount: 1000,
        currency: 'usd',
        status: 'succeeded',
        payment_method: paymentMethodId,
      };

      mockPaymentIntents.confirm.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await service.confirmPaymentIntent(paymentIntentId, paymentMethodId);

      expect(result).toEqual(mockPaymentIntent);
      expect(mockPaymentIntents.confirm).toHaveBeenCalledWith(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    });

    it('should throw BadRequestException on confirm error', async () => {
      const error = new Error('Payment method declined');
      mockPaymentIntents.confirm.mockRejectedValue(error);

      await expect(service.confirmPaymentIntent('pi_123', 'pm_card')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.confirmPaymentIntent('pi_123', 'pm_card')).rejects.toThrow(
        'Failed to confirm payment intent: Payment method declined',
      );
    });
  });

  describe('createRefund', () => {
    it('should create full refund successfully', async () => {
      const paymentIntentId = 'pi_123';

      const mockRefund: Partial<Stripe.Refund> = {
        id: 're_123',
        payment_intent: paymentIntentId,
        amount: 1000,
        status: 'succeeded',
      };

      mockRefunds.create.mockResolvedValue(mockRefund as Stripe.Refund);

      const result = await service.createRefund(paymentIntentId);

      expect(result).toEqual(mockRefund);
      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
      });
    });

    it('should create partial refund successfully', async () => {
      const paymentIntentId = 'pi_123';
      const amount = 500;

      const mockRefund: Partial<Stripe.Refund> = {
        id: 're_123',
        payment_intent: paymentIntentId,
        amount,
        status: 'succeeded',
      };

      mockRefunds.create.mockResolvedValue(mockRefund as Stripe.Refund);

      const result = await service.createRefund(paymentIntentId, amount);

      expect(result).toEqual(mockRefund);
      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount,
      });
    });

    it('should create refund with reason', async () => {
      const paymentIntentId = 'pi_123';
      const amount = 1000;
      const reason: Stripe.RefundCreateParams.Reason = 'requested_by_customer';

      const mockRefund: Partial<Stripe.Refund> = {
        id: 're_123',
        payment_intent: paymentIntentId,
        amount,
        status: 'succeeded',
        reason,
      };

      mockRefunds.create.mockResolvedValue(mockRefund as Stripe.Refund);

      const result = await service.createRefund(paymentIntentId, amount, reason);

      expect(result).toEqual(mockRefund);
      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        amount,
        reason,
      });
    });

    it('should create refund with reason but no amount', async () => {
      const paymentIntentId = 'pi_123';
      const reason: Stripe.RefundCreateParams.Reason = 'fraudulent';

      const mockRefund: Partial<Stripe.Refund> = {
        id: 're_123',
        payment_intent: paymentIntentId,
        amount: 1000,
        status: 'succeeded',
        reason,
      };

      mockRefunds.create.mockResolvedValue(mockRefund as Stripe.Refund);

      const result = await service.createRefund(paymentIntentId, undefined, reason);

      expect(result).toEqual(mockRefund);
      expect(mockRefunds.create).toHaveBeenCalledWith({
        payment_intent: paymentIntentId,
        reason,
      });
    });

    it('should throw BadRequestException on refund error', async () => {
      const error = new Error('Charge already refunded');
      mockRefunds.create.mockRejectedValue(error);

      await expect(service.createRefund('pi_123')).rejects.toThrow(BadRequestException);
      await expect(service.createRefund('pi_123')).rejects.toThrow(
        'Failed to create refund: Charge already refunded',
      );
    });

    it('should handle unknown error type', async () => {
      mockRefunds.create.mockRejectedValue({ code: 'unknown_error' });

      await expect(service.createRefund('pi_123')).rejects.toThrow(
        'Failed to create refund: Unknown error',
      );
    });
  });

  describe('retrievePaymentMethod', () => {
    it('should retrieve payment method successfully', async () => {
      const paymentMethodId = 'pm_card_visa';

      const mockPaymentMethod: Partial<Stripe.PaymentMethod> = {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        } as Stripe.PaymentMethod.Card,
      };

      mockPaymentMethods.retrieve.mockResolvedValue(mockPaymentMethod as Stripe.PaymentMethod);

      const result = await service.retrievePaymentMethod(paymentMethodId);

      expect(result).toEqual(mockPaymentMethod);
      expect(mockPaymentMethods.retrieve).toHaveBeenCalledWith(paymentMethodId);
    });

    it('should throw BadRequestException when payment method not found', async () => {
      const error = new Error('No such payment_method');
      mockPaymentMethods.retrieve.mockRejectedValue(error);

      await expect(service.retrievePaymentMethod('pm_invalid')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.retrievePaymentMethod('pm_invalid')).rejects.toThrow(
        'Failed to retrieve payment method: No such payment_method',
      );
    });

    it('should handle unknown error type', async () => {
      mockPaymentMethods.retrieve.mockRejectedValue(123);

      await expect(service.retrievePaymentMethod('pm_123')).rejects.toThrow(
        'Failed to retrieve payment method: Unknown error',
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully with string payload', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'test_signature';

      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_123',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_123',
          } as Stripe.PaymentIntent,
        },
      };

      mockWebhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event);

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toEqual(mockEvent);
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_secret',
      );
    });

    it('should verify webhook signature successfully with Buffer payload', () => {
      const payload = Buffer.from(JSON.stringify({ type: 'payment_intent.succeeded' }));
      const signature = 'test_signature';

      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_456',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_456',
          } as Stripe.PaymentIntent,
        },
      };

      mockWebhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event);

      const result = service.verifyWebhookSignature(payload, signature);

      expect(result).toEqual(mockEvent);
      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_secret',
      );
    });

    it('should throw BadRequestException on invalid signature', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'invalid_signature';
      const error = new Error('Invalid signature');

      mockWebhooks.constructEvent.mockImplementation(() => {
        throw error;
      });

      expect(() => service.verifyWebhookSignature(payload, signature)).toThrow(
        BadRequestException,
      );
      expect(() => service.verifyWebhookSignature(payload, signature)).toThrow(
        'Webhook signature verification failed: Invalid signature',
      );
    });

    it('should handle unknown error type', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'test_signature';

      mockWebhooks.constructEvent.mockImplementation(() => {
        throw { status: 400 };
      });

      expect(() => service.verifyWebhookSignature(payload, signature)).toThrow(
        'Webhook signature verification failed: Unknown error',
      );
    });

    it('should handle null error', () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 'test_signature';

      mockWebhooks.constructEvent.mockImplementation(() => {
        throw null;
      });

      expect(() => service.verifyWebhookSignature(payload, signature)).toThrow(
        'Webhook signature verification failed: Unknown error',
      );
    });
  });
});
