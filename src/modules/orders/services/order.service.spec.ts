import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { Order, OrderStatus } from '../../../database/entities/order.entity';
import { OrderLineItem } from '../../../database/entities/order-line-item.entity';
import { CheckoutSession, CheckoutStatus } from '../../../database/entities/checkout-session.entity';
import { OrderFSMService } from './order-fsm.service';
import { OutboxService } from './outbox.service';
import {
  createMockRepository,
  createMockDataSource,
} from '../../../../test/mocks/repository.mock';
import {
  createMockFSMService,
  createMockOutboxService,
} from '../../../../test/mocks/services.mock';

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: ReturnType<typeof createMockRepository>;
  let lineItemRepository: ReturnType<typeof createMockRepository>;
  let checkoutRepository: ReturnType<typeof createMockRepository>;
  let fsmService: ReturnType<typeof createMockFSMService>;
  let outboxService: ReturnType<typeof createMockOutboxService>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    orderRepository = createMockRepository();
    lineItemRepository = createMockRepository();
    checkoutRepository = createMockRepository();
    fsmService = createMockFSMService();
    outboxService = createMockOutboxService();
    dataSource = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepository,
        },
        {
          provide: getRepositoryToken(OrderLineItem),
          useValue: lineItemRepository,
        },
        {
          provide: getRepositoryToken(CheckoutSession),
          useValue: checkoutRepository,
        },
        {
          provide: OrderFSMService,
          useValue: fsmService,
        },
        {
          provide: OutboxService,
          useValue: outboxService,
        },
        {
          provide: 'DataSource',
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrderFromCheckout', () => {
    const mockCheckoutSession = {
      id: 'session-1',
      user_id: 'user-1',
      status: CheckoutStatus.IN_PROGRESS,
      is_expired: false,
      order_id: null,
      totals: {
        subtotal: 2999,
        tax_amount: 300,
        shipping_amount: 500,
        discount_amount: 0,
        total_amount: 3799,
        currency: 'USD',
      },
      currency: 'USD',
      cart_snapshot: [
        {
          productId: 'product-1',
          merchantId: 'merchant-1',
          productName: 'Test Product',
          sku: 'TEST-001',
          type: 'physical',
          quantity: 1,
          price: 2999,
          currency: 'USD',
        },
      ],
      shipping_address: {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        city: 'New York',
        country: 'US',
      },
      billing_address: null,
      payment_method: null,
      promo_codes: [],
      metadata: {},
    };

    it('should create order with line items successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-2024-001',
        user_id: 'user-1',
        status: OrderStatus.PENDING,
        total_amount: 3799,
        line_items: [],
      };

      // Setup mocks
      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: jest.fn((entity) => ({
            findOne: jest.fn().mockResolvedValue(mockCheckoutSession),
          })),
          create: jest.fn((entity, data) => ({ ...data, id: 'generated-id' })),
          save: jest.fn().mockResolvedValue(mockOrder),
          query: jest.fn().mockResolvedValue([{ order_number: 'ORD-2024-001' }]),
          findOne: jest.fn().mockResolvedValue({
            ...mockOrder,
            line_items: [
              {
                id: 'line-item-1',
                order_id: 'order-1',
                type: 'physical',
                status: 'pending',
              },
            ],
          }),
        };
        return callback(mockManager);
      });

      const result = await service.createOrderFromCheckout('session-1');

      expect(result).toBeDefined();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'order.created',
          aggregateType: 'order',
        }),
        expect.anything()
      );
    });

    it('should throw NotFoundException if checkout session not found', async () => {
      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(null),
          })),
        };
        return callback(mockManager);
      });

      await expect(service.createOrderFromCheckout('invalid-session')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if session is not in progress', async () => {
      const expiredSession = { ...mockCheckoutSession, status: CheckoutStatus.EXPIRED };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(expiredSession),
          })),
        };
        return callback(mockManager);
      });

      await expect(service.createOrderFromCheckout('session-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if session is expired', async () => {
      const expiredSession = { ...mockCheckoutSession, is_expired: true };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(expiredSession),
          })),
        };
        return callback(mockManager);
      });

      await expect(service.createOrderFromCheckout('session-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if order already created', async () => {
      const completedSession = { ...mockCheckoutSession, order_id: 'existing-order' };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          getRepository: jest.fn(() => ({
            findOne: jest.fn().mockResolvedValue(completedSession),
          })),
        };
        return callback(mockManager);
      });

      await expect(service.createOrderFromCheckout('session-1')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getOrderById', () => {
    it('should return order with relations', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-2024-001',
        line_items: [],
        user: {},
      };

      orderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.getOrderById('order-1');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        relations: ['line_items', 'line_items.product', 'line_items.merchant', 'user'],
      });
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrderById('invalid-order')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getUserOrders', () => {
    it('should return paginated orders', async () => {
      const mockOrders = [
        { id: 'order-1', order_number: 'ORD-001' },
        { id: 'order-2', order_number: 'ORD-002' },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockOrders, 2]),
        andWhere: jest.fn().mockReturnThis(),
      };

      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getUserOrders('user-1', { page: 1, limit: 10 });

      expect(result).toEqual({
        orders: mockOrders,
        total: 2,
        page: 1,
        totalPages: 1,
      });
    });

    it('should filter by status if provided', async () => {
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      orderRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getUserOrders('user-1', { status: OrderStatus.COMPLETED });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('order.status = :status', {
        status: OrderStatus.COMPLETED,
      });
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and update line items', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-001',
        line_items: [
          { id: 'line-1', status: 'pending' },
          { id: 'line-2', status: 'pending' },
        ],
      };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockOrder),
          save: jest.fn().mockResolvedValue(mockOrder),
        };
        return callback(mockManager);
      });

      const result = await service.confirmPayment('order-1');

      expect(result).toBeDefined();
      expect(fsmService.transitionLineItem).toHaveBeenCalledTimes(2);
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'order.payment_confirmed',
        }),
        expect.anything()
      );
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and cancellable line items', async () => {
      const mockOrder = {
        id: 'order-1',
        order_number: 'ORD-001',
        status: OrderStatus.PENDING,
        line_items: [
          { id: 'line-1', status: 'pending', is_cancellable: true },
          { id: 'line-2', status: 'shipped', is_cancellable: false },
        ],
      };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockOrder),
          save: jest.fn().mockResolvedValue(mockOrder),
        };
        return callback(mockManager);
      });

      const result = await service.cancelOrder('order-1', 'Customer request');

      expect(result).toBeDefined();
      expect(fsmService.transitionLineItem).toHaveBeenCalledTimes(1);
      expect(outboxService.addEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'order.cancelled',
        }),
        expect.anything()
      );
    });

    it('should throw BadRequestException if order already cancelled', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.CANCELLED,
        line_items: [],
      };

      dataSource.transaction.mockImplementation(async (callback) => {
        const mockManager = {
          findOne: jest.fn().mockResolvedValue(mockOrder),
        };
        return callback(mockManager);
      });

      await expect(service.cancelOrder('order-1', 'Test')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
