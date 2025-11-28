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
import { OrderService } from '../orders/services/order.service';
import { StripePaymentService } from './services/stripe-payment.service';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let checkoutSessionRepository: Repository<CheckoutSession>;
  let cartService: CartService;
  let totalsService: TotalsCalculationService;
  let inventoryService: InventoryReservationService;
  let stripePaymentService: StripePaymentService;
  let orderService: OrderService;

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

  const mockOrderService = {
    createOrderFromCheckout: jest.fn(),
  };

  const mockStripePaymentService = {
    createPaymentIntent: jest.fn(),
    confirmPaymentIntent: jest.fn(),
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
          provide: StripePaymentService,
          useValue: mockStripePaymentService,
        },
        {
          provide: OrderService,
          useValue: mockOrderService,
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
    stripePaymentService = module.get<StripePaymentService>(StripePaymentService);
    orderService = module.get<OrderService>(OrderService);

    // Reset mocks
    jest.clearAllMocks();

    // Mock private processPayment method to return success by default
    jest.spyOn(service as any, 'processPayment').mockResolvedValue({ success: true });
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
        expires_at: new Date(Date.now() - 10000),
        is_expired: true,
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockCheckoutSessionRepository.save.mockResolvedValue(session);
      mockInventoryService.releaseReservation.mockResolvedValue(undefined);

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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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
        payment_method: PaymentMethodType.CARD,
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

  describe('completeCheckout', () => {
    let mockQueryRunner: any;

    beforeEach(() => {
      // Create fresh mock query runner for each test
      mockQueryRunner = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          save: jest.fn(),
        },
      };
      mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);
    });

    it('should complete checkout and create order successfully', async () => {
      const sessionId = 'session-123';
      const userId = 'user-123';

      const session = {
        id: sessionId,
        user_id: userId,
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        step: CheckoutStep.ORDER_REVIEW,
        cart_snapshot: [
          {
            productId: 'prod-1',
            productName: 'Test Product',
            quantity: 2,
            price: 1000,
            currency: 'USD',
            type: 'physical',
          },
        ],
        totals: {
          subtotal: 2000,
          tax_amount: 200,
          shipping_amount: 500,
          discount_amount: 0,
          total_amount: 2700,
          currency: 'USD',
        },
        shipping_address: {
          country: 'US',
          city: 'New York',
          street: '123 Main St',
          postal_code: '10001',
        },
        payment_details: {
          paymentIntentId: 'pi_test_123',
        },
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      const createdOrder = {
        id: 'order-123',
        order_number: 'ORD-2024-001',
        user_id: userId,
        status: 'pending',
        total_amount: 2700,
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockResolvedValue(createdOrder);
      mockInventoryService.commitReservation.mockResolvedValue(undefined);
      mockCartService.clearCart.mockResolvedValue(undefined);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.COMPLETED,
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
      });

      const result = await service.completeCheckout(sessionId, userId, {});

      // Verify OrderService was called with correct parameters
      expect(mockOrderService.createOrderFromCheckout).toHaveBeenCalledWith(
        sessionId,
        'pi_test_123',
      );

      // Verify inventory was committed
      expect(mockInventoryService.commitReservation).toHaveBeenCalledWith(
        sessionId,
        session.cart_snapshot,
      );

      // Verify cart was cleared
      expect(mockCartService.clearCart).toHaveBeenCalled();

      // Verify transaction was committed
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Verify session was updated
      expect(result.status).toBe(CheckoutStatus.COMPLETED);
      expect(result.order_id).toBe(createdOrder.id);
      expect(result.order_number).toBe(createdOrder.order_number);
    });

    it('should handle payment intent ID from payment_details', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        cart_snapshot: [{ productId: 'prod-1', quantity: 1, price: 1000 }],
        totals: { total_amount: 1000, currency: 'USD' },
        payment_details: {
          paymentIntentId: 'pi_custom_456',
          last4: '4242',
        },
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      const createdOrder = {
        id: 'order-456',
        order_number: 'ORD-2024-002',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockResolvedValue(createdOrder);
      mockInventoryService.commitReservation.mockResolvedValue(undefined);
      mockCartService.clearCart.mockResolvedValue(undefined);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.COMPLETED,
        order_id: createdOrder.id,
      });

      await service.completeCheckout('session-123', 'user-123', {});

      // Verify payment intent ID was extracted correctly
      expect(mockOrderService.createOrderFromCheckout).toHaveBeenCalledWith(
        'session-123',
        'pi_custom_456',
      );
    });

    it('should handle missing payment_details gracefully', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        cart_snapshot: [{ productId: 'prod-1', quantity: 1, price: 1000 }],
        totals: { total_amount: 1000, currency: 'USD' },
        payment_details: null,
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      const createdOrder = {
        id: 'order-789',
        order_number: 'ORD-2024-003',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockResolvedValue(createdOrder);
      mockInventoryService.commitReservation.mockResolvedValue(undefined);
      mockCartService.clearCart.mockResolvedValue(undefined);
      mockQueryRunner.manager.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.COMPLETED,
        order_id: createdOrder.id,
      });

      await service.completeCheckout('session-123', 'user-123', {});

      // Verify undefined was passed when payment_details is null
      expect(mockOrderService.createOrderFromCheckout).toHaveBeenCalledWith(
        'session-123',
        undefined,
      );
    });

    it('should rollback and throw error when order creation fails', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        cart_snapshot: [{ productId: 'prod-1', quantity: 1, price: 1000 }],
        totals: { total_amount: 1000, currency: 'USD' },
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockRejectedValue(
        new Error('Insufficient inventory'),
      );
      mockInventoryService.releaseReservation.mockResolvedValue(undefined);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.FAILED,
        error_message: 'Order creation failed: Insufficient inventory',
      });

      await expect(service.completeCheckout('session-123', 'user-123', {})).rejects.toThrow(
        BadRequestException,
      );

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();

      // Verify inventory reservation was released
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith('session-123');

      // Verify session was marked as failed
      expect(mockCheckoutSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CheckoutStatus.FAILED,
          error_message: 'Order creation failed: Insufficient inventory',
        }),
      );
    });

    it('should throw error when inventory commit fails', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        cart_snapshot: [{ productId: 'prod-1', quantity: 1, price: 1000 }],
        totals: { total_amount: 1000, currency: 'USD' },
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      const createdOrder = {
        id: 'order-123',
        order_number: 'ORD-2024-001',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockResolvedValue(createdOrder);
      mockInventoryService.commitReservation.mockRejectedValue(
        new Error('Stock level changed'),
      );
      mockInventoryService.releaseReservation.mockResolvedValue(undefined);
      mockCheckoutSessionRepository.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.FAILED,
      });

      await expect(service.completeCheckout('session-123', 'user-123', {})).rejects.toThrow(
        BadRequestException,
      );

      // Verify order was created before inventory commit failed
      expect(mockOrderService.createOrderFromCheckout).toHaveBeenCalled();

      // Verify transaction was rolled back
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();

      // Verify inventory reservation was released
      expect(mockInventoryService.releaseReservation).toHaveBeenCalled();
    });

    it('should continue checkout if cart clearing fails (non-critical)', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.IN_PROGRESS,
        payment_method: PaymentMethodType.CARD,
        cart_snapshot: [{ productId: 'prod-1', quantity: 1, price: 1000 }],
        totals: { total_amount: 1000, currency: 'USD' },
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      const createdOrder = {
        id: 'order-123',
        order_number: 'ORD-2024-001',
      };

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);
      mockOrderService.createOrderFromCheckout.mockResolvedValue(createdOrder);
      mockInventoryService.commitReservation.mockResolvedValue(undefined);
      mockCartService.clearCart.mockRejectedValue(new Error('Redis connection failed'));
      mockQueryRunner.manager.save.mockResolvedValue({
        ...session,
        status: CheckoutStatus.COMPLETED,
        order_id: createdOrder.id,
      });

      // Should not throw even though cart clearing failed
      const result = await service.completeCheckout('session-123', 'user-123', {});

      // Verify checkout still completed
      expect(result.status).toBe(CheckoutStatus.COMPLETED);
      expect(result.order_id).toBe(createdOrder.id);

      // Verify transaction was committed despite cart error
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if session not found', async () => {
      mockCheckoutSessionRepository.findOne.mockResolvedValue(null);

      await expect(service.completeCheckout('invalid-session', 'user-123', {})).rejects.toThrow(
        NotFoundException,
      );

      // Verify no order creation attempted
      expect(mockOrderService.createOrderFromCheckout).not.toHaveBeenCalled();
    });

    it('should throw error if session already completed', async () => {
      const session = {
        id: 'session-123',
        user_id: 'user-123',
        status: CheckoutStatus.COMPLETED,
        order_id: 'order-999',
        expires_at: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      } as unknown as CheckoutSession;

      mockCheckoutSessionRepository.findOne.mockResolvedValue(session);

      await expect(service.completeCheckout('session-123', 'user-123', {})).rejects.toThrow(
        BadRequestException,
      );

      // Verify no duplicate order created
      expect(mockOrderService.createOrderFromCheckout).not.toHaveBeenCalled();
    });
  });
});
