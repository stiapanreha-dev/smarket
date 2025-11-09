import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment, PaymentStatusEnum } from '../../../database/entities/payment.entity';
import { PaymentSplit, PaymentSplitStatus } from '../../../database/entities/payment-split.entity';
import { Refund, RefundStatus } from '../../../database/entities/refund.entity';
import { Order } from '../../../database/entities/order.entity';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { StripeProvider } from '../providers/stripe.provider';
import { YooKassaProvider } from '../providers/yookassa.provider';
import { NetworkIntlProvider } from '../providers/network-intl.provider';
import { SplitCalculationService } from './split-calculation.service';
import { OutboxService } from '../../orders/services/outbox.service';
import { AggregateType } from '../../../database/entities/order-outbox.entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providers: Map<string, PaymentProvider> = new Map();

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentSplit)
    private readonly splitRepository: Repository<PaymentSplit>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly stripeProvider: StripeProvider,
    private readonly yooKassaProvider: YooKassaProvider,
    private readonly networkIntlProvider: NetworkIntlProvider,
    private readonly splitCalculationService: SplitCalculationService,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService,
  ) {
    // Register providers
    this.providers.set('stripe', this.stripeProvider);
    this.providers.set('yookassa', this.yooKassaProvider);
    this.providers.set('network_intl', this.networkIntlProvider);
  }

  /**
   * Authorize payment (create payment intent)
   */
  async authorizePayment(
    orderId: string,
    idempotencyKey?: string,
  ): Promise<Payment> {
    // Generate idempotency key if not provided
    const idemKey = idempotencyKey || this.generateIdempotencyKey(orderId);

    // Check for existing payment with this idempotency key
    const existingPayment = await this.paymentRepository.findOne({
      where: { idempotency_key: idemKey },
      relations: ['splits'],
    });

    if (existingPayment) {
      this.logger.log(`Returning existing payment for idempotency key ${idemKey}`);
      return existingPayment;
    }

    // Execute in transaction
    return this.dataSource.transaction(async (manager) => {
      // Load order with line items
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['line_items'],
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      // Select payment provider based on currency/region
      const provider = this.selectProvider(order.currency);
      this.logger.log(`Selected provider ${provider} for currency ${order.currency}`);

      // Calculate splits
      const splits = await this.splitCalculationService.calculateSplits(order.line_items);
      const totalPlatformFee = splits.reduce((sum, s) => sum + s.platform_fee, 0);

      // Create payment record
      const payment = manager.create(Payment, {
        order_id: orderId,
        provider,
        amount_minor: order.total_amount,
        currency: order.currency,
        platform_fee: totalPlatformFee,
        idempotency_key: idemKey,
        status: PaymentStatusEnum.PENDING,
        metadata: {
          ip: order.metadata?.ip,
          userAgent: order.metadata?.userAgent,
        },
      });

      await manager.save(payment);

      // Create payment splits
      const splitEntities = splits.map((split) =>
        manager.create(PaymentSplit, {
          payment_id: payment.id,
          merchant_id: split.merchant_id,
          gross_amount: split.gross_amount,
          platform_fee: split.platform_fee,
          processing_fee: split.processing_fee,
          net_amount: split.net_amount,
          currency: payment.currency,
          status: PaymentSplitStatus.PENDING,
          escrow_release_date: this.splitCalculationService.calculateEscrowReleaseDate(
            order.line_items[0]?.type || 'physical',
          ),
        }),
      );

      await manager.save(splitEntities);

      // Call payment provider
      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new Error(`Payment provider ${provider} not found`);
      }

      const paymentIntent = await providerInstance.createPaymentIntent({
        amount: payment.amount_minor,
        currency: payment.currency,
        orderId: order.id,
        userId: order.user_id || undefined,
        customerEmail: order.guest_email || undefined,
        customerPhone: order.guest_phone || undefined,
        merchantIds: splits.map((s) => s.merchant_id),
        returnUrl: this.configService.get('FRONTEND_URL'),
        items: order.line_items.map((item) => ({
          name: item.product_name,
          price: item.unit_price,
          quantity: item.quantity,
          type: item.type as 'physical' | 'digital' | 'service',
        })),
      });

      // Update payment with provider response
      payment.provider_payment_id = paymentIntent.id;
      payment.status = paymentIntent.status;
      payment.requires_action = paymentIntent.requiresAction || false;
      payment.action_url = paymentIntent.actionUrl || null;

      if (paymentIntent.status === 'authorized') {
        payment.authorized_amount = paymentIntent.amount;
        payment.authorized_at = new Date();
      }

      await manager.save(payment);

      // Add event to outbox
      await this.outboxService.addEvent(
        {
          aggregateId: payment.id,
          aggregateType: AggregateType.PAYMENT,
          eventType: 'payment.authorized',
          payload: {
            paymentId: payment.id,
            orderId: order.id,
            amount: payment.amount_minor,
            currency: payment.currency,
            provider: payment.provider,
          },
        },
        manager,
      );

      this.logger.log(`Payment authorized: ${payment.id}, provider intent: ${paymentIntent.id}`);

      return payment;
    });
  }

  /**
   * Capture payment
   */
  async capturePayment(paymentId: string): Promise<Payment> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
        relations: ['splits'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.status !== PaymentStatusEnum.AUTHORIZED) {
        throw new BadRequestException(
          `Cannot capture payment in status ${payment.status}`,
        );
      }

      // Call provider to capture
      const provider = this.providers.get(payment.provider);
      if (!provider) {
        throw new Error(`Payment provider ${payment.provider} not found`);
      }

      const result = await provider.capturePayment(
        payment.provider_payment_id!,
        payment.authorized_amount || payment.amount_minor,
      );

      if (!result.success) {
        payment.status = PaymentStatusEnum.FAILED;
        payment.error_message = result.errorMessage || 'Capture failed';
        payment.failed_at = new Date();
        await manager.save(payment);
        throw new Error(result.errorMessage || 'Capture failed');
      }

      // Update payment
      payment.status = PaymentStatusEnum.CAPTURED;
      payment.captured_amount = result.amount;
      payment.captured_at = new Date();
      await manager.save(payment);

      // Update splits
      await manager.update(
        PaymentSplit,
        { payment_id: payment.id },
        { status: PaymentSplitStatus.CAPTURED },
      );

      // Add event to outbox
      await this.outboxService.addEvent(
        {
          aggregateId: payment.id,
          aggregateType: AggregateType.PAYMENT,
          eventType: 'payment.captured',
          payload: {
            paymentId: payment.id,
            orderId: payment.order_id,
            amount: payment.captured_amount,
          },
        },
        manager,
      );

      this.logger.log(`Payment captured: ${payment.id}, amount: ${payment.captured_amount}`);

      return payment;
    });
  }

  /**
   * Refund payment
   */
  async refundPayment(
    paymentId: string,
    amount: number,
    reason: string,
    lineItemId?: string,
    userId?: string,
  ): Promise<Refund> {
    return this.dataSource.transaction(async (manager) => {
      const payment = await manager.findOne(Payment, {
        where: { id: paymentId },
        relations: ['splits'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!payment) {
        throw new NotFoundException(`Payment ${paymentId} not found`);
      }

      if (payment.status !== PaymentStatusEnum.CAPTURED) {
        throw new BadRequestException(
          `Cannot refund payment in status ${payment.status}`,
        );
      }

      // Check refund amount
      const maxRefund = payment.captured_amount - payment.refunded_amount;
      if (amount > maxRefund) {
        throw new BadRequestException(
          `Refund amount ${amount} exceeds available amount ${maxRefund}`,
        );
      }

      // Create refund record
      const refund = manager.create(Refund, {
        payment_id: paymentId,
        order_line_item_id: lineItemId || null,
        amount_minor: amount,
        currency: payment.currency,
        status: RefundStatus.PENDING,
        reason,
        created_by: userId || null,
      });

      await manager.save(refund);

      // Call provider to refund
      const provider = this.providers.get(payment.provider);
      if (!provider) {
        throw new Error(`Payment provider ${payment.provider} not found`);
      }

      const result = await provider.refundPayment(
        payment.provider_payment_id!,
        amount,
        reason,
      );

      if (!result.success) {
        refund.status = RefundStatus.FAILED;
        refund.error_message = result.errorMessage || 'Refund failed';
        await manager.save(refund);
        throw new Error(result.errorMessage || 'Refund failed');
      }

      // Update refund
      refund.provider_refund_id = result.refundId;
      refund.status = RefundStatus.COMPLETED;
      refund.processed_at = new Date();
      await manager.save(refund);

      // Update payment refunded amount
      payment.refunded_amount += amount;
      if (payment.refunded_amount === payment.captured_amount) {
        payment.status = PaymentStatusEnum.REFUNDED;
      } else if (payment.refunded_amount > 0) {
        payment.status = PaymentStatusEnum.PARTIALLY_REFUNDED;
      }
      await manager.save(payment);

      // Update splits (proportionally reduce net amounts)
      for (const split of payment.splits) {
        const refundSplit = this.splitCalculationService.calculateRefundSplit(
          split,
          amount,
          payment.amount_minor,
        );
        split.net_amount -= refundSplit.merchant_refund;
        await manager.save(split);
      }

      // Add event to outbox
      await this.outboxService.addEvent(
        {
          aggregateId: refund.id,
          aggregateType: AggregateType.PAYMENT,
          eventType: 'payment.refunded',
          payload: {
            refundId: refund.id,
            paymentId: payment.id,
            orderId: payment.order_id,
            amount,
            reason,
          },
        },
        manager,
      );

      this.logger.log(`Payment refunded: ${payment.id}, refund: ${refund.id}, amount: ${amount}`);

      return refund;
    });
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['splits', 'refunds', 'order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    return payment;
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return this.paymentRepository.findOne({
      where: { order_id: orderId },
      relations: ['splits', 'refunds'],
    });
  }

  /**
   * Select payment provider based on currency/region
   */
  private selectProvider(currency: string): string {
    const currencyUpper = currency.toUpperCase();

    if (currencyUpper === 'RUB') {
      return 'yookassa';
    } else if (currencyUpper === 'AED') {
      return 'network_intl';
    } else {
      return 'stripe';
    }
  }

  /**
   * Generate idempotency key
   */
  private generateIdempotencyKey(orderId: string): string {
    const timestamp = Date.now();
    return `payment_${orderId}_${timestamp}`;
  }

  /**
   * Get provider instance
   */
  getProvider(providerName: string): PaymentProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider ${providerName} not found`);
    }
    return provider;
  }
}
