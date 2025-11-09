import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { Payment, PaymentStatusEnum } from '../../../database/entities/payment.entity';
import { PaymentSplit } from '../../../database/entities/payment-split.entity';
import { Refund } from '../../../database/entities/refund.entity';
import { Order } from '../../../database/entities/order.entity';
import { StripeProvider } from '../providers/stripe.provider';
import { YooKassaProvider } from '../providers/yookassa.provider';
import { NetworkIntlProvider } from '../providers/network-intl.provider';
import { SplitCalculationService } from './split-calculation.service';
import { OutboxService } from '../../orders/services/outbox.service';
import { createMockRepository, createMockDataSource } from '../../../../test/mocks/repository.mock';
import {
  createMockOutboxService,
  createMockSplitCalculationService,
  createMockConfigService,
} from '../../../../test/mocks/services.mock';
import {
  createMockStripeProvider,
  createMockStripeProviderWithFailures,
} from '../../../../test/mocks/stripe.mock';

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepository: ReturnType<typeof createMockRepository>;
  let splitRepository: ReturnType<typeof createMockRepository>;
  let refundRepository: ReturnType<typeof createMockRepository>;
  let orderRepository: ReturnType<typeof createMockRepository>;
  let dataSource: ReturnType<typeof createMockDataSource>;
  let stripeProvider: ReturnType<typeof createMockStripeProvider>;
  let outboxService: ReturnType<typeof createMockOutboxService>;
  let splitCalculationService: ReturnType<typeof createMockSplitCalculationService>;
  let configService: ReturnType<typeof createMockConfigService>;

  beforeEach(async () => {
    paymentRepository = createMockRepository();
    splitRepository = createMockRepository();
    refundRepository = createMockRepository();
    orderRepository = createMockRepository();
    dataSource = createMockDataSource();
    stripeProvider = createMockStripeProvider();
    outboxService = createMockOutboxService();
    splitCalculationService = createMockSplitCalculationService();
    configService = createMockConfigService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepository,
        },
        {
          provide: getRepositoryToken(PaymentSplit),
          useValue: splitRepository,
        },
        {
          provide: getRepositoryToken(Refund),
          useValue: refundRepository,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: 'DataSource',
          useValue: dataSource,
        },
        {
          provide: StripeProvider,
          useValue: stripeProvider,
        },
        {
          provide: YooKassaProvider,
          useValue: createMockStripeProvider(),
        },
        {
          provide: NetworkIntlProvider,
          useValue: createMockStripeProvider(),
        },
        {
          provide: SplitCalculationService,
          useValue: splitCalculationService,
        },
        {
          provide: OutboxService,
          useValue: outboxService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authorizePayment', () => {
    const mockOrder = {
      id: 'order-1',
      order_number: 'ORD-001',
      user_id: 'user-1',
      currency: 'USD',
      total_amount: 3799,
      line_items: [
        {
          id: 'line-1',
          merchant_id: 'merchant-1',
          type: 'physical',
          unit_price: 2999,
          quantity: 1,
        },
      ],
    };

    it('should create payment with splits successfully', async () => {
      const mockPayment = {
        id: 'payment-1',
        order_id: 'order-1',
        provider: 'stripe',
        amount_minor: 3799,
        currency: 'USD',
        status: PaymentStatusEnum.PENDING,
        provider_payment_id: 'pi_test_123',
      };

      paymentRepository.findOne.mockResolvedValue(null);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockOrder),
          create: jest.fn((entity, data) => ({ ...data, id: 'generated-id' })),
          save: jest.fn().mockResolvedValue(mockPayment),
        };
        return callback(mockManager);
      });

      stripeProvider.createPaymentIntent.mockResolvedValue({
        id: 'pi_test_123',
        status: 'requires_payment_method',
        amount: 3799,
        currency: 'USD',
        requiresAction: false,
        actionUrl: null,
        clientSecret: 'pi_test_secret',
      });

      const result = await service.authorizePayment('order-1');

      expect(result).toBeDefined();
      expect(stripeProvider.createPaymentIntent).toHaveBeenCalled();
      expect(splitCalculationService.calculateSplits).toHaveBeenCalled();
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'payment.authorized',
        }),
        expect.anything(),
      );
    });

    it('should return existing payment for duplicate idempotency key', async () => {
      const existingPayment = {
        id: 'payment-1',
        idempotency_key: 'payment_order-1_123',
        splits: [],
      };

      paymentRepository.findOne.mockResolvedValue(existingPayment);

      const result = await service.authorizePayment('order-1', 'payment_order-1_123');

      expect(result).toEqual(existingPayment);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if order not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(null),
        };
        return callback(mockManager);
      });

      await expect(service.authorizePayment('invalid-order')).rejects.toThrow(NotFoundException);
    });

    it('should select correct provider based on currency', async () => {
      const rubOrder = { ...mockOrder, currency: 'RUB' };

      paymentRepository.findOne.mockResolvedValue(null);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(rubOrder),
          create: jest.fn((entity, data) => ({ ...data, id: 'generated-id' })),
          save: jest.fn().mockResolvedValue({ provider: 'yookassa' }),
        };
        return callback(mockManager);
      });

      const result = await service.authorizePayment('order-1');

      expect(result.provider).toBe('yookassa');
    });
  });

  describe('capturePayment', () => {
    const mockPayment = {
      id: 'payment-1',
      order_id: 'order-1',
      provider: 'stripe',
      provider_payment_id: 'pi_test_123',
      status: PaymentStatusEnum.AUTHORIZED,
      authorized_amount: 3799,
      amount_minor: 3799,
      splits: [{ id: 'split-1', payment_id: 'payment-1' }],
    };

    it('should capture payment successfully', async () => {
      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
          save: jest.fn().mockResolvedValue({
            ...mockPayment,
            status: PaymentStatusEnum.CAPTURED,
            captured_amount: 3799,
          }),
          update: jest.fn(),
        };
        return callback(mockManager);
      });

      stripeProvider.capturePayment.mockResolvedValue({
        success: true,
        amount: 3799,
      });

      const result = await service.capturePayment('payment-1');

      expect(result.status).toBe(PaymentStatusEnum.CAPTURED);
      expect(stripeProvider.capturePayment).toHaveBeenCalledWith('pi_test_123', 3799);
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'payment.captured',
        }),
        expect.anything(),
      );
    });

    it('should throw BadRequestException if payment not in authorized status', async () => {
      const pendingPayment = { ...mockPayment, status: PaymentStatusEnum.PENDING };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(pendingPayment),
        };
        return callback(mockManager);
      });

      await expect(service.capturePayment('payment-1')).rejects.toThrow(BadRequestException);
    });

    it('should handle capture failure from provider', async () => {
      const failingProvider = createMockStripeProviderWithFailures();
      failingProvider.setFailCapture(true);

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
          save: jest.fn(),
        };

        // Replace provider temporarily
        const originalProvider = service.getProvider('stripe');
        (service as any).providers.set('stripe', failingProvider);

        try {
          return await callback(mockManager);
        } finally {
          (service as any).providers.set('stripe', originalProvider);
        }
      });

      await expect(service.capturePayment('payment-1')).rejects.toThrow();
    });
  });

  describe('refundPayment', () => {
    const mockPayment = {
      id: 'payment-1',
      order_id: 'order-1',
      provider: 'stripe',
      provider_payment_id: 'pi_test_123',
      status: PaymentStatusEnum.CAPTURED,
      captured_amount: 3799,
      refunded_amount: 0,
      amount_minor: 3799,
      currency: 'USD',
      splits: [
        {
          id: 'split-1',
          merchant_id: 'merchant-1',
          gross_amount: 2999,
          net_amount: 2700,
        },
      ],
    };

    it('should refund payment successfully', async () => {
      const refundAmount = 1000;

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
          create: jest.fn((entity, data) => ({ ...data, id: 'refund-1' })),
          save: jest.fn((entity) => entity),
        };
        return callback(mockManager);
      });

      stripeProvider.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_test_123',
      });

      splitCalculationService.calculateRefundSplit.mockReturnValue({
        platform_refund: 100,
        merchant_refund: 900,
      });

      const result = await service.refundPayment('payment-1', refundAmount, 'Customer request');

      expect(result).toBeDefined();
      expect(stripeProvider.refundPayment).toHaveBeenCalledWith(
        'pi_test_123',
        refundAmount,
        'Customer request',
      );
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'payment.refunded',
        }),
        expect.anything(),
      );
    });

    it('should throw BadRequestException if refund amount exceeds available', async () => {
      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
        };
        return callback(mockManager);
      });

      await expect(service.refundPayment('payment-1', 5000, 'Test')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update payment status to REFUNDED when fully refunded', async () => {
      const fullRefundAmount = 3799;
      let savedPayment;

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockPayment),
          create: jest.fn((entity, data) => ({ ...data, id: 'refund-1' })),
          save: jest.fn((entity) => {
            if (entity.captured_amount) {
              savedPayment = entity;
            }
            return entity;
          }),
        };
        return callback(mockManager);
      });

      stripeProvider.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_test_123',
      });

      await service.refundPayment('payment-1', fullRefundAmount, 'Full refund');

      expect(savedPayment.status).toBe(PaymentStatusEnum.REFUNDED);
    });
  });

  describe('getPayment', () => {
    it('should return payment with relations', async () => {
      const mockPayment = {
        id: 'payment-1',
        order_id: 'order-1',
        splits: [],
        refunds: [],
        order: {},
      };

      paymentRepository.findOne.mockResolvedValue(mockPayment);

      const result = await service.getPayment('payment-1');

      expect(result).toEqual(mockPayment);
      expect(paymentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        relations: ['splits', 'refunds', 'order'],
      });
    });

    it('should throw NotFoundException if payment not found', async () => {
      paymentRepository.findOne.mockResolvedValue(null);

      await expect(service.getPayment('invalid-payment')).rejects.toThrow(NotFoundException);
    });
  });
});
