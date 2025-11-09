import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CheckoutService } from './checkout.service';
import {
  CheckoutSession,
  CheckoutStatus,
  CheckoutStep,
  PaymentMethodType,
} from '../../database/entities/checkout-session.entity';
import { CartService } from '../cart/cart.service';
import { TotalsCalculationService } from './services/totals-calculation.service';
import { InventoryReservationService } from './services/inventory-reservation.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let checkoutSessionRepository: Repository<CheckoutSession>;
  let cartService: CartService;
  let totalsService: TotalsCalculationService;
  let inventoryService: InventoryReservationService;

  const mockCheckoutSessionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockCartService = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
  };

  const mockTotalsService = {
    calculateTotals: jest.fn(),
    recalculateTotals: jest.fn(),
    validateAndApplyPromoCode: jest.fn(),
  };

  const mockInventoryService = {
    reserveInventory: jest.fn(),
    releaseReservation: jest.fn(),
    commitReservation: jest.fn(),
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => ({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
      },
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(CheckoutSession),
          useValue: mockCheckoutSessionRepository,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: TotalsCalculationService,
          useValue: mockTotalsService,
        },
        {
          provide: InventoryReservationService,
          useValue: mockInventoryService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
    checkoutSessionRepository = module.get(getRepositoryToken(CheckoutSession));
    cartService = module.get<CartService>(CartService);
    totalsService = module.get<TotalsCalculationService>(TotalsCalculationService);
    inventoryService = module.get<InventoryReservationService>(InventoryReservationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create checkout session successfully', async () => {
      const userId = 'user-123';
      const cart = {
        id: 'cart-1',
        userId,
        items: [
          {
            productId: 'prod-1',
            variantId: 'var-1',
            quantity: 2,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-1',
            type: 'physical',
            productName: 'Test Product',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const totals = {
        subtotal: 2000,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total_amount: 2000,
        currency: 'USD',
      };

      const savedSession = {
        id: 'session-123',
        user_id: userId,
        cart_snapshot: cart.items,
        totals,
        step: CheckoutStep.CART_REVIEW,
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(),
      } as unknown as CheckoutSession;

      mockCartService.getCart.mockResolvedValue(cart);
      mockTotalsService.calculateTotals.mockResolvedValue(totals);
      mockCheckoutSessionRepository.create.mockReturnValue(savedSession);
      mockCheckoutSessionRepository.save.mockResolvedValue(savedSession);
      mockInventoryService.reserveInventory.mockResolvedValue({
        success: true,
        reservationId: 'res-123',
      });

      const result = await service.createSession(userId, {});

      expect(result).toEqual(savedSession);
      expect(mockCartService.getCart).toHaveBeenCalledWith(userId, undefined);
      expect(mockInventoryService.reserveInventory).toHaveBeenCalled();
    });

    it('should throw error if cart is empty', async () => {
      const userId = 'user-123';
      const emptyCart = {
        id: 'cart-1',
        userId,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCartService.getCart.mockResolvedValue(emptyCart);

      await expect(service.createSession(userId, {})).rejects.toThrow(BadRequestException);
    });

    it('should rollback if inventory reservation fails', async () => {
      const userId = 'user-123';
      const cart = {
        id: 'cart-1',
        userId,
        items: [
          {
            productId: 'prod-1',
            variantId: 'var-1',
            quantity: 2,
            price: 1000,
            currency: 'USD',
            merchantId: 'merchant-1',
            type: 'physical',
            productName: 'Test Product',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const totals = {
        subtotal: 2000,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 0,
        total_amount: 2000,
        currency: 'USD',
      };

      const savedSession = {
        id: 'session-123',
        user_id: userId,
        cart_snapshot: cart.items,
        totals,
      } as unknown as CheckoutSession;

      mockCartService.getCart.mockResolvedValue(cart);
      mockTotalsService.calculateTotals.mockResolvedValue(totals);
      mockCheckoutSessionRepository.create.mockReturnValue(savedSession);
      mockCheckoutSessionRepository.save.mockResolvedValue(savedSession);
      mockInventoryService.reserveInventory.mockResolvedValue({
        success: false,
        reservationId: 'res-123',
        errors: [{ variantId: 'var-1', reason: 'Insufficient inventory' }],
      });

      await expect(service.createSession(userId, {})).rejects.toThrow(BadRequestException);

      expect(mockCheckoutSessionRepository.delete).toHaveBeenCalledWith(savedSession.id);
    });
  });

  describe('getSession', () => {
    it('should return session if found', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';
      const session = {
        id: sessionId,
        user_id: userId,
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);

      const result = await service.getSession(sessionId, userId);

      expect(result).toEqual(session);
    });

    it('should throw NotFoundException if session not found', async () => {
      mockCheckoutSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.getSession('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should throw error if session expired', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() - 10000),
        is_expired: true,
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockCheckoutSessionRepository.save.mockResolvedValue(session);

      await expect(service.getSession('session-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateShippingAddress', () => {
    it('should update shipping address successfully', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';
      const session = {
        id: sessionId,
        user_id: userId,
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
        requires_shipping: true,
        cart_snapshot: [],
        totals: { subtotal: 1000, currency: 'USD' },
      } as unknown as CheckoutSession;

      const addressDto = {
        country: 'US',
        city: 'New York',
        street: '123 Main St',
        postal_code: '10001',
        phone: '+1234567890',
      };

      const updatedTotals = {
        subtotal: 1000,
        tax_amount: 100,
        shipping_amount: 500,
        discount_amount: 0,
        total_amount: 1600,
        currency: 'USD',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockTotalsService.recalculateTotals.mockResolvedValue(updatedTotals);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        shipping_address: addressDto,
        totals: updatedTotals,
        step: CheckoutStep.PAYMENT_METHOD,
      });

      const result = await service.updateShippingAddress(sessionId, userId, addressDto);

      expect(result.shipping_address).toEqual(addressDto);
      expect(result.step).toBe(CheckoutStep.PAYMENT_METHOD);
    });

    it('should throw error if shipping not required', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
        requires_shipping: false,
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);

      await expect(
        service.updateShippingAddress('session-123', 'user-123', {} as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method successfully', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
        requires_shipping: false,
        step: CheckoutStep.CART_REVIEW,
      } as unknown as CheckoutSession;

      const paymentDto = {
        payment_method: PaymentMethodType.CARD,
        payment_details: { last4: '4242' },
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        payment_method: paymentDto.payment_method,
        payment_details: paymentDto.payment_details,
        step: CheckoutStep.ORDER_REVIEW,
      });

      const result = await service.updatePaymentMethod('session-123', 'user-123', paymentDto);

      expect(result.payment_method).toBe(PaymentMethodType.CARD);
      expect(result.step).toBe(CheckoutStep.ORDER_REVIEW);
    });
  });

  describe('applyPromoCode', () => {
    it('should apply valid promo code', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
        totals: { subtotal: 5000, currency: 'USD' },
        cart_snapshot: [],
        promo_codes: [],
      } as unknown as CheckoutSession;

      const promoApplication = {
        code: 'SAVE10',
        discount_amount: 500,
        discount_type: 'percentage' as const,
        discount_value: 10,
        applied_at: new Date(),
      };

      const updatedTotals = {
        subtotal: 5000,
        tax_amount: 0,
        shipping_amount: 0,
        discount_amount: 500,
        total_amount: 4500,
        currency: 'USD',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockTotalsService.validateAndApplyPromoCode.mockResolvedValue(promoApplication);
      mockTotalsService.recalculateTotals.mockResolvedValue(updatedTotals);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        promo_codes: [promoApplication],
        totals: updatedTotals,
      });

      const result = await service.applyPromoCode('session-123', 'user-123', {
        code: 'SAVE10',
      });

      expect(result.promo_codes).toHaveLength(1);
      expect(result.totals.discount_amount).toBe(500);
    });

    it('should throw error for invalid promo code', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
        totals: { subtotal: 5000, currency: 'USD' },
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockTotalsService.validateAndApplyPromoCode.mockResolvedValue(null);

      await expect(
        service.applyPromoCode('session-123', 'user-123', {
          code: 'INVALID',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelSession', () => {
    it('should cancel session successfully', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: new Date(Date.now() + 10000),
        is_expired: false,
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.CANCELLED,
      });
      mockInventoryService.releaseReservation.mockResolvedValue(undefined);

      const result = await service.cancelSession('session-123', 'user-123');

      expect(result.status).toBe(CheckoutStatus.CANCELLED);
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith('session-123');
    });
  });
});
