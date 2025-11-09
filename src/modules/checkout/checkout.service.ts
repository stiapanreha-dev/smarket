import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuid } from 'uuid';
import {
  CheckoutSession,
  CheckoutStep,
  CheckoutStatus,
  CartItemSnapshot,
  Address,
} from '../../database/entities/checkout-session.entity';
import { CartService } from '../cart/cart.service';
import { TotalsCalculationService } from './services/totals-calculation.service';
import { InventoryReservationService } from './services/inventory-reservation.service';
import {
  CreateCheckoutSessionDto,
  UpdateShippingAddressDto,
  UpdatePaymentMethodDto,
  ApplyPromoCodeDto,
  CompleteCheckoutDto,
} from './dto';

const SESSION_TTL_MINUTES = 30;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionRepository: Repository<CheckoutSession>,
    private readonly cartService: CartService,
    private readonly totalsService: TotalsCalculationService,
    private readonly inventoryService: InventoryReservationService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new checkout session
   * Step 1: Cart Review
   */
  async createSession(
    userId: string | undefined,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    // Get current cart
    const cart = await this.cartService.getCart(userId, dto.sessionId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Create cart snapshot with locked prices
    const cartSnapshot: CartItemSnapshot[] = await this.createCartSnapshot(cart.items);

    // Calculate initial totals (no shipping yet)
    const currency = cart.items[0]?.currency || 'USD';
    const totals = await this.totalsService.calculateTotals(
      cartSnapshot,
      undefined,
      undefined,
      currency,
    );

    // Create checkout session
    const checkoutSession = this.checkoutSessionRepository.create({
      user_id: userId || null,
      session_id: dto.sessionId || null,
      cart_snapshot: cartSnapshot,
      step: CheckoutStep.CART_REVIEW,
      totals,
      status: CheckoutStatus.IN_PROGRESS,
      expires_at: new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000),
      metadata: dto.metadata || {},
    });

    const savedSession = await this.checkoutSessionRepository.save(checkoutSession);

    // Reserve inventory
    const reservationResult = await this.inventoryService.reserveInventory(
      savedSession.id,
      cartSnapshot,
    );

    if (!reservationResult.success) {
      // Rollback session creation
      await this.checkoutSessionRepository.delete(savedSession.id);
      throw new BadRequestException(
        `Failed to reserve inventory: ${JSON.stringify(reservationResult.errors)}`,
      );
    }

    this.logger.log(`Created checkout session ${savedSession.id}`);
    return savedSession;
  }

  /**
   * Get checkout session by ID
   */
  async getSession(sessionId: string, userId?: string): Promise<CheckoutSession> {
    const session = await this.checkoutSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    // Check ownership for authenticated users
    if (userId && session.user_id && session.user_id !== userId) {
      throw new NotFoundException('Checkout session not found');
    }

    // Check if session expired
    if (session.is_expired) {
      await this.expireSession(session);
      throw new BadRequestException('Checkout session has expired');
    }

    return session;
  }

  /**
   * Update shipping address
   * Step 2: Shipping Address
   */
  async updateShippingAddress(
    sessionId: string,
    userId: string | undefined,
    dto: UpdateShippingAddressDto,
  ): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId, userId);

    // Validate that session requires shipping
    if (!session.requires_shipping) {
      throw new BadRequestException('Shipping address not required for digital/service items');
    }

    const shippingAddress: Address = {
      country: dto.country,
      state: dto.state,
      city: dto.city,
      street: dto.street,
      street2: dto.street2,
      postal_code: dto.postal_code,
      phone: dto.phone,
      first_name: dto.first_name,
      last_name: dto.last_name,
      company: dto.company,
    };

    // Update billing address if requested
    const billingAddress = dto.use_as_billing ? shippingAddress : null;

    // Recalculate totals with shipping
    const totals = await this.totalsService.recalculateTotals(
      session.totals,
      session.cart_snapshot,
      shippingAddress,
      session.promo_codes || undefined,
    );

    // Update session
    session.shipping_address = shippingAddress;
    if (dto.use_as_billing) {
      session.billing_address = billingAddress;
    }
    session.totals = totals;
    session.step = CheckoutStep.PAYMENT_METHOD;

    const updated = await this.checkoutSessionRepository.save(session);

    this.logger.log(`Updated shipping address for session ${sessionId}`);
    return updated;
  }

  /**
   * Update payment method
   * Step 3: Payment Method
   */
  async updatePaymentMethod(
    sessionId: string,
    userId: string | undefined,
    dto: UpdatePaymentMethodDto,
  ): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId, userId);

    // Validate step progression
    if (session.requires_shipping && session.step === CheckoutStep.CART_REVIEW) {
      throw new BadRequestException(
        'Please provide shipping address before selecting payment method',
      );
    }

    session.payment_method = dto.payment_method;
    session.payment_details = dto.payment_details || null;
    session.step = CheckoutStep.ORDER_REVIEW;

    const updated = await this.checkoutSessionRepository.save(session);

    this.logger.log(`Updated payment method for session ${sessionId}`);
    return updated;
  }

  /**
   * Apply promo code
   */
  async applyPromoCode(
    sessionId: string,
    userId: string | undefined,
    dto: ApplyPromoCodeDto,
  ): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId, userId);

    // Check if code already applied
    if (session.promo_codes?.some((promo) => promo.code.toUpperCase() === dto.code.toUpperCase())) {
      throw new BadRequestException('Promo code already applied');
    }

    // Validate and apply promo code
    const promoApplication = await this.totalsService.validateAndApplyPromoCode(
      dto.code,
      session.totals.subtotal,
      session.totals.currency,
    );

    if (!promoApplication) {
      throw new BadRequestException('Invalid or expired promo code');
    }

    // Add to session
    session.promo_codes = session.promo_codes || [];
    session.promo_codes.push(promoApplication);

    // Recalculate totals
    const totals = await this.totalsService.recalculateTotals(
      session.totals,
      session.cart_snapshot,
      session.shipping_address || undefined,
      session.promo_codes,
    );

    session.totals = totals;

    const updated = await this.checkoutSessionRepository.save(session);

    this.logger.log(`Applied promo code ${dto.code} to session ${sessionId}`);
    return updated;
  }

  /**
   * Complete checkout
   * Step 5: Payment & Order Creation
   */
  async completeCheckout(
    sessionId: string,
    userId: string | undefined,
    dto: CompleteCheckoutDto,
  ): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId, userId);

    // Validate session is ready for completion
    this.validateReadyForCompletion(session);

    // Check for duplicate order creation (idempotency)
    if (dto.idempotency_key) {
      const existingOrder = await this.checkoutSessionRepository.findOne({
        where: {
          idempotency_key: dto.idempotency_key,
          status: CheckoutStatus.COMPLETED,
        },
      });

      if (existingOrder) {
        this.logger.warn(`Duplicate order attempt with key ${dto.idempotency_key}`);
        return existingOrder;
      }

      session.idempotency_key = dto.idempotency_key;
    }

    // Use Saga pattern for transaction management
    return await this.executeCheckoutSaga(session);
  }

  /**
   * Execute checkout with Saga pattern for rollback capability
   */
  private async executeCheckoutSaga(session: CheckoutSession): Promise<CheckoutSession> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Update session to payment step
      session.step = CheckoutStep.PAYMENT;
      await queryRunner.manager.save(session);

      // Step 2: Process payment (mock - in production, integrate with payment gateway)
      const paymentResult = await this.processPayment(session);
      if (!paymentResult.success) {
        throw new BadRequestException(`Payment failed: ${paymentResult.error}`);
      }

      // Step 3: Create order (mock - actual order creation would happen here)
      const orderId = await this.createOrder(session, queryRunner);
      session.order_id = orderId;

      // Step 4: Commit inventory reservations
      await this.inventoryService.commitReservation(session.id, session.cart_snapshot);

      // Step 5: Clear user's cart
      await this.clearCart(session);

      // Step 6: Mark session as completed
      session.status = CheckoutStatus.COMPLETED;
      session.step = CheckoutStep.CONFIRMATION;
      session.completed_at = new Date();

      await queryRunner.manager.save(session);
      await queryRunner.commitTransaction();

      this.logger.log(`Checkout completed for session ${session.id}`);

      // Async: Send confirmation email (don't block response)
      this.sendConfirmationEmail(session).catch((err) =>
        this.logger.error('Failed to send confirmation email', err),
      );

      return session;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      // Update session with error
      session.status = CheckoutStatus.FAILED;
      session.error_message = error.message;
      await this.checkoutSessionRepository.save(session);

      // Release inventory reservations
      await this.inventoryService
        .releaseReservation(session.id)
        .catch((err) => this.logger.error('Failed to release reservation', err));

      this.logger.error(`Checkout failed for session ${session.id}`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Validate session is ready for completion
   */
  private validateReadyForCompletion(session: CheckoutSession): void {
    if (session.status !== CheckoutStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot complete checkout in status: ${session.status}`);
    }

    if (session.requires_shipping && !session.shipping_address) {
      throw new BadRequestException('Shipping address required');
    }

    if (!session.payment_method) {
      throw new BadRequestException('Payment method required');
    }

    if (session.is_expired) {
      throw new BadRequestException('Checkout session has expired');
    }
  }

  /**
   * Process payment (mock implementation)
   * In production, integrate with Stripe, PayPal, etc.
   */
  private async processPayment(
    session: CheckoutSession,
  ): Promise<{ success: boolean; error?: string; transactionId?: string }> {
    // Mock payment processing
    this.logger.log(
      `Processing ${session.payment_method} payment for ${session.totals.total_amount} ${session.totals.currency}`,
    );

    // Simulate payment gateway call
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock: 95% success rate
    const isSuccess = Math.random() > 0.05;

    if (isSuccess) {
      return {
        success: true,
        transactionId: `txn_${uuid()}`,
      };
    } else {
      return {
        success: false,
        error: 'Payment declined by issuer',
      };
    }
  }

  /**
   * Create order (mock implementation)
   * In production, create actual Order entity
   */
  private async createOrder(session: CheckoutSession, _queryRunner: any): Promise<string> {
    // Mock order creation
    const orderId = uuid();

    this.logger.log(`Created order ${orderId} for checkout session ${session.id}`);

    // In production:
    // const order = queryRunner.manager.create(Order, {
    //   user_id: session.user_id,
    //   items: session.cart_snapshot,
    //   totals: session.totals,
    //   shipping_address: session.shipping_address,
    //   payment_method: session.payment_method,
    //   status: 'pending',
    // });
    // await queryRunner.manager.save(order);
    // return order.id;

    return orderId;
  }

  /**
   * Clear user's cart after successful checkout
   */
  private async clearCart(session: CheckoutSession): Promise<void> {
    try {
      await this.cartService.clearCart(
        session.user_id || undefined,
        session.session_id || undefined,
      );
      this.logger.log(`Cleared cart for session ${session.id}`);
    } catch (error) {
      this.logger.error('Failed to clear cart', error);
      // Don't fail checkout if cart clearing fails
    }
  }

  /**
   * Send order confirmation email
   */
  private async sendConfirmationEmail(session: CheckoutSession): Promise<void> {
    // Mock email sending
    // In production, use EmailService
    this.logger.log(`Sending confirmation email for order ${session.order_id}`);
  }

  /**
   * Expire a session and release reservations
   */
  private async expireSession(session: CheckoutSession): Promise<void> {
    if (session.status === CheckoutStatus.IN_PROGRESS) {
      session.status = CheckoutStatus.EXPIRED;
      await this.checkoutSessionRepository.save(session);

      // Release inventory
      await this.inventoryService
        .releaseReservation(session.id)
        .catch((err) => this.logger.error('Failed to release reservation', err));
    }
  }

  /**
   * Create cart snapshot with locked prices
   */
  private async createCartSnapshot(cartItems: any[]): Promise<CartItemSnapshot[]> {
    return cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
      merchantId: item.merchantId,
      type: item.type,
      productName: item.productName || 'Product',
      variantName: item.variantName,
      sku: item.sku,
      metadata: item.metadata,
    }));
  }

  /**
   * Cleanup expired sessions (runs every hour)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredSessions(): Promise<void> {
    this.logger.log('Running expired sessions cleanup');

    const expiredSessions = await this.checkoutSessionRepository.find({
      where: {
        status: CheckoutStatus.IN_PROGRESS,
        expires_at: LessThan(new Date()),
      },
      take: 100, // Process in batches
    });

    for (const session of expiredSessions) {
      await this.expireSession(session);
    }

    this.logger.log(`Cleaned up ${expiredSessions.length} expired sessions`);
  }

  /**
   * Cancel checkout session
   */
  async cancelSession(sessionId: string, userId?: string): Promise<CheckoutSession> {
    const session = await this.getSession(sessionId, userId);

    if (session.status !== CheckoutStatus.IN_PROGRESS) {
      throw new BadRequestException('Can only cancel in-progress sessions');
    }

    session.status = CheckoutStatus.CANCELLED;
    const updated = await this.checkoutSessionRepository.save(session);

    // Release reservations
    await this.inventoryService.releaseReservation(sessionId);

    this.logger.log(`Cancelled checkout session ${sessionId}`);
    return updated;
  }
}
