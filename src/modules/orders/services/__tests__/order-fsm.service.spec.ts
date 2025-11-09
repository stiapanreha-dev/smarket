import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrderFSMService } from '../order-fsm.service';
import {
  OrderLineItem,
  LineItemType,
  PhysicalItemStatus,
  DigitalItemStatus,
  ServiceItemStatus,
} from '../../../../database/entities/order-line-item.entity';
import { OrderStatusTransition } from '../../../../database/entities/order-status-transition.entity';

describe('OrderFSMService', () => {
  let service: OrderFSMService;
  let lineItemRepository: Repository<OrderLineItem>;
  let transitionRepository: Repository<OrderStatusTransition>;
  let dataSource: DataSource;

  const mockLineItemRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTransitionRepository = {
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((callback) => callback(mockEntityManager)),
  };

  const mockEntityManager = {
    getRepository: jest.fn((entity) => {
      if (entity === OrderLineItem) return mockLineItemRepository;
      if (entity === OrderStatusTransition) return mockTransitionRepository;
    }),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderFSMService,
        {
          provide: getRepositoryToken(OrderLineItem),
          useValue: mockLineItemRepository,
        },
        {
          provide: getRepositoryToken(OrderStatusTransition),
          useValue: mockTransitionRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OrderFSMService>(OrderFSMService);
    lineItemRepository = module.get<Repository<OrderLineItem>>(getRepositoryToken(OrderLineItem));
    transitionRepository = module.get<Repository<OrderStatusTransition>>(
      getRepositoryToken(OrderStatusTransition),
    );
    dataSource = module.get<DataSource>(DataSource);

    jest.clearAllMocks();
  });

  describe('canTransition', () => {
    it('should allow valid physical item transitions', () => {
      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.PENDING,
          PhysicalItemStatus.PAYMENT_CONFIRMED,
        ),
      ).toBe(true);

      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.PAYMENT_CONFIRMED,
          PhysicalItemStatus.PREPARING,
        ),
      ).toBe(true);

      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.SHIPPED,
          PhysicalItemStatus.DELIVERED,
        ),
      ).toBe(true);
    });

    it('should reject invalid physical item transitions', () => {
      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.PENDING,
          PhysicalItemStatus.SHIPPED,
        ),
      ).toBe(false);

      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.DELIVERED,
          PhysicalItemStatus.PENDING,
        ),
      ).toBe(false);
    });

    it('should allow valid digital item transitions', () => {
      expect(
        service.canTransition(
          LineItemType.DIGITAL,
          DigitalItemStatus.PENDING,
          DigitalItemStatus.PAYMENT_CONFIRMED,
        ),
      ).toBe(true);

      expect(
        service.canTransition(
          LineItemType.DIGITAL,
          DigitalItemStatus.PAYMENT_CONFIRMED,
          DigitalItemStatus.ACCESS_GRANTED,
        ),
      ).toBe(true);
    });

    it('should allow valid service item transitions', () => {
      expect(
        service.canTransition(
          LineItemType.SERVICE,
          ServiceItemStatus.PENDING,
          ServiceItemStatus.PAYMENT_CONFIRMED,
        ),
      ).toBe(true);

      expect(
        service.canTransition(
          LineItemType.SERVICE,
          ServiceItemStatus.BOOKING_CONFIRMED,
          ServiceItemStatus.REMINDER_SENT,
        ),
      ).toBe(true);

      expect(
        service.canTransition(
          LineItemType.SERVICE,
          ServiceItemStatus.REMINDER_SENT,
          ServiceItemStatus.NO_SHOW,
        ),
      ).toBe(true);
    });

    it('should not allow transitions from terminal states', () => {
      expect(
        service.canTransition(
          LineItemType.PHYSICAL,
          PhysicalItemStatus.CANCELLED,
          PhysicalItemStatus.PENDING,
        ),
      ).toBe(false);

      expect(
        service.canTransition(
          LineItemType.DIGITAL,
          DigitalItemStatus.REFUNDED,
          DigitalItemStatus.ACCESS_GRANTED,
        ),
      ).toBe(false);
    });
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for a given status', () => {
      const allowed = service.getAllowedTransitions(
        LineItemType.PHYSICAL,
        PhysicalItemStatus.PENDING,
      );

      expect(allowed).toContain(PhysicalItemStatus.PAYMENT_CONFIRMED);
      expect(allowed).toContain(PhysicalItemStatus.CANCELLED);
      expect(allowed).not.toContain(PhysicalItemStatus.SHIPPED);
    });

    it('should return empty array for terminal states', () => {
      const allowed = service.getAllowedTransitions(
        LineItemType.PHYSICAL,
        PhysicalItemStatus.CANCELLED,
      );

      expect(allowed).toEqual([]);
    });
  });

  describe('transitionLineItem', () => {
    it('should successfully transition a line item', async () => {
      const lineItem: Partial<OrderLineItem> = {
        id: 'item-1',
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.PENDING,
        order_id: 'order-1',
        status_history: [],
        fulfillment_data: {},
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(lineItem),
      };

      mockLineItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);
      mockEntityManager.save.mockResolvedValue({
        ...lineItem,
        status: PhysicalItemStatus.PAYMENT_CONFIRMED,
      });
      mockEntityManager.create.mockImplementation((entity, data) => data);

      const result = await service.transitionLineItem(
        'item-1',
        PhysicalItemStatus.PAYMENT_CONFIRMED,
        { reason: 'Payment captured' },
        mockEntityManager,
      );

      expect(result.status).toBe(PhysicalItemStatus.PAYMENT_CONFIRMED);
      expect(mockEntityManager.save).toHaveBeenCalled();
      expect(mockEntityManager.create).toHaveBeenCalledWith(
        OrderStatusTransition,
        expect.objectContaining({
          from_status: PhysicalItemStatus.PENDING,
          to_status: PhysicalItemStatus.PAYMENT_CONFIRMED,
        }),
      );
    });

    it('should throw error for invalid transition', async () => {
      const lineItem: Partial<OrderLineItem> = {
        id: 'item-1',
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.PENDING,
        order_id: 'order-1',
        status_history: [],
      };

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(lineItem),
      };

      mockLineItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(
        service.transitionLineItem(
          'item-1',
          PhysicalItemStatus.SHIPPED,
          undefined,
          mockEntityManager,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if line item not found', async () => {
      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        setLock: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockLineItemRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      await expect(
        service.transitionLineItem(
          'nonexistent',
          PhysicalItemStatus.PAYMENT_CONFIRMED,
          undefined,
          mockEntityManager,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('canRefund', () => {
    it('should allow refund for physical item within 14 days', () => {
      const lineItem: Partial<OrderLineItem> = {
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.DELIVERED,
        fulfillment_data: {
          delivered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        },
      } as OrderLineItem;

      const result = service.canRefund(lineItem as OrderLineItem);
      expect(result.allowed).toBe(true);
    });

    it('should reject refund for physical item after 14 days', () => {
      const lineItem: Partial<OrderLineItem> = {
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.DELIVERED,
        fulfillment_data: {
          delivered_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        },
      } as OrderLineItem;

      const result = service.canRefund(lineItem as OrderLineItem);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('14 days');
    });

    it('should allow refund for digital item before download', () => {
      const lineItem: Partial<OrderLineItem> = {
        type: LineItemType.DIGITAL,
        status: DigitalItemStatus.ACCESS_GRANTED,
        fulfillment_data: {
          download_count: 0,
        },
      } as OrderLineItem;

      const result = service.canRefund(lineItem as OrderLineItem);
      expect(result.allowed).toBe(true);
    });

    it('should reject refund for service item within 24h of appointment', () => {
      const lineItem: Partial<OrderLineItem> = {
        type: LineItemType.SERVICE,
        status: ServiceItemStatus.BOOKING_CONFIRMED,
        fulfillment_data: {
          booking_date: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
        },
      } as OrderLineItem;

      const result = service.canRefund(lineItem as OrderLineItem);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('24h');
    });
  });
});
