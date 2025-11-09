import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../../../database/entities/order.entity';
import { OrderLineItem, LineItemType, PhysicalItemStatus } from '../../../database/entities/order-line-item.entity';
import { CheckoutSession, CheckoutStatus, CartItemSnapshot } from '../../../database/entities/checkout-session.entity';
import { OrderFSMService, TransitionMetadata } from './order-fsm.service';
import { OutboxService } from './outbox.service';
import { AggregateType } from '../../../database/entities/order-outbox.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderLineItem)
    private readonly lineItemRepository: Repository<OrderLineItem>,
    @InjectRepository(CheckoutSession)
    private readonly checkoutRepository: Repository<CheckoutSession>,
    private readonly fsmService: OrderFSMService,
    private readonly outboxService: OutboxService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create order from checkout session
   */
  async createOrderFromCheckout(
    checkoutSessionId: string,
    paymentIntentId?: string,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Load and validate checkout session
      const session = await manager
        .getRepository(CheckoutSession)
        .findOne({ where: { id: checkoutSessionId } });

      if (!session) {
        throw new NotFoundException('Checkout session not found');
      }

      if (session.status !== CheckoutStatus.IN_PROGRESS) {
        throw new BadRequestException(
          `Cannot create order from ${session.status} checkout session`,
        );
      }

      if (session.is_expired) {
        throw new BadRequestException('Checkout session has expired');
      }

      if (session.order_id) {
        throw new BadRequestException('Order already created for this session');
      }

      // 2. Generate order number
      const orderNumber = await this.generateOrderNumber(manager);

      // 3. Create order
      const order = manager.create(Order, {
        order_number: orderNumber,
        user_id: session.user_id,
        status: OrderStatus.PENDING,
        currency: session.totals.currency,
        subtotal: session.totals.subtotal,
        tax_amount: session.totals.tax_amount,
        shipping_amount: session.totals.shipping_amount,
        discount_amount: session.totals.discount_amount,
        total_amount: session.totals.total_amount,
        guest_email: session.user_id ? null : (session.metadata?.guest_email || null),
        guest_phone: session.user_id ? null : (session.metadata?.guest_phone || null),
        shipping_address: session.shipping_address,
        billing_address: session.billing_address || session.shipping_address,
        payment_method: session.payment_method || null,
        payment_status: PaymentStatus.PENDING,
        payment_intent_id: paymentIntentId,
        checkout_session_id: session.id,
        metadata: {
          payment_intent_id: paymentIntentId,
          promo_codes: session.promo_codes,
          ...session.metadata,
        },
      });

      await manager.save(order);

      // 4. Create line items
      const lineItems: OrderLineItem[] = [];

      for (const cartItem of session.cart_snapshot) {
        const lineItem = manager.create(OrderLineItem, {
          order_id: order.id,
          merchant_id: cartItem.merchantId,
          product_id: cartItem.productId,
          variant_id: cartItem.variantId,
          type: cartItem.type as LineItemType,
          status: 'pending',
          product_name: cartItem.productName,
          product_sku: cartItem.sku,
          variant_attributes: cartItem.metadata?.variantAttributes || null,
          quantity: cartItem.quantity,
          unit_price: cartItem.price,
          total_price: cartItem.price * cartItem.quantity,
          currency: cartItem.currency,
          fulfillment_data: this.initializeFulfillmentData(cartItem),
          status_history: [
            {
              to: 'pending',
              timestamp: new Date(),
            },
          ],
        });

        lineItems.push(lineItem);
      }

      await manager.save(lineItems);

      // 5. Update checkout session
      session.status = CheckoutStatus.COMPLETED;
      session.order_id = order.id;
      session.completed_at = new Date();
      await manager.save(session);

      // 6. Add events to outbox
      await this.outboxService.addEvent(
        {
          aggregateId: order.id,
          aggregateType: AggregateType.ORDER,
          eventType: 'order.created',
          payload: {
            order_id: order.id,
            order_number: order.order_number,
            user_id: order.user_id,
            total_amount: order.total_amount,
            currency: order.currency,
            merchant_ids: [...new Set(lineItems.map((li) => li.merchant_id))],
            line_items: lineItems.map((li) => ({
              id: li.id,
              type: li.type,
              merchant_id: li.merchant_id,
              product_id: li.product_id,
              quantity: li.quantity,
            })),
          },
        },
        manager,
      );

      this.logger.log(`Order ${order.order_number} created from checkout ${session.id}`);

      // 7. Load relations and return
      return manager.findOne(Order, {
        where: { id: order.id },
        relations: ['line_items', 'line_items.product', 'line_items.merchant'],
      });
    });
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['line_items', 'line_items.product', 'line_items.merchant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { order_number: orderNumber },
      relations: ['line_items', 'line_items.product', 'line_items.merchant', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }

    return order;
  }

  /**
   * Get user orders with pagination
   */
  async getUserOrders(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: OrderStatus;
    } = {},
  ): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.line_items', 'lineItem')
      .leftJoinAndSelect('lineItem.product', 'product')
      .where('order.user_id = :userId', { userId })
      .orderBy('order.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (options.status) {
      queryBuilder.andWhere('order.status = :status', { status: options.status });
    }

    const [orders, total] = await queryBuilder.getManyAndCount();

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Update line item status using FSM
   */
  async updateLineItemStatus(
    orderId: string,
    lineItemId: string,
    newStatus: string,
    metadata?: TransitionMetadata,
  ): Promise<OrderLineItem> {
    const lineItem = await this.lineItemRepository.findOne({
      where: { id: lineItemId, order_id: orderId },
    });

    if (!lineItem) {
      throw new NotFoundException('Line item not found');
    }

    // Use FSM to transition
    const updated = await this.fsmService.transitionLineItem(
      lineItemId,
      newStatus,
      metadata,
    );

    // Emit event
    await this.outboxService.addEvent({
      aggregateId: lineItem.id,
      aggregateType: AggregateType.ORDER_LINE_ITEM,
      eventType: 'line_item.status_changed',
      payload: {
        order_id: orderId,
        line_item_id: lineItemId,
        from_status: lineItem.status,
        to_status: newStatus,
        item_type: lineItem.type,
      },
    });

    // Update order status based on line items
    await this.updateOrderStatus(orderId);

    return updated;
  }

  /**
   * Update order status based on line items
   */
  private async updateOrderStatus(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['line_items'],
    });

    if (!order) return;

    const statuses = order.line_items.map((li) => li.status);

    let newStatus: OrderStatus = order.status;

    // Determine order status
    if (statuses.every((s) => s === 'cancelled')) {
      newStatus = OrderStatus.CANCELLED;
    } else if (
      statuses.every(
        (s) =>
          s === 'delivered' ||
          s === 'completed' ||
          s === 'downloaded' ||
          s === 'access_granted',
      )
    ) {
      newStatus = OrderStatus.COMPLETED;
      order.completed_at = new Date();
    } else if (
      statuses.some(
        (s) =>
          s.includes('shipped') ||
          s === 'in_progress' ||
          s === 'preparing' ||
          s === 'ready_to_ship',
      )
    ) {
      newStatus = OrderStatus.PROCESSING;
    } else if (statuses.every((s) => s === 'payment_confirmed')) {
      newStatus = OrderStatus.CONFIRMED;
    }

    if (order.status !== newStatus) {
      order.status = newStatus;
      await this.orderRepository.save(order);

      // Emit event
      await this.outboxService.addEvent({
        aggregateId: order.id,
        aggregateType: AggregateType.ORDER,
        eventType: 'order.status_changed',
        payload: {
          order_id: order.id,
          order_number: order.order_number,
          old_status: order.status,
          new_status: newStatus,
        },
      });
    }
  }

  /**
   * Confirm payment for order
   */
  async confirmPayment(orderId: string): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['line_items'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      // Update payment status
      order.payment_status = PaymentStatus.CAPTURED;
      await manager.save(order);

      // Transition all line items to payment_confirmed
      for (const lineItem of order.line_items) {
        await this.fsmService.transitionLineItem(
          lineItem.id,
          'payment_confirmed',
          { reason: 'Payment captured' },
          manager,
        );
      }

      // Emit event
      await this.outboxService.addEvent(
        {
          aggregateId: order.id,
          aggregateType: AggregateType.ORDER,
          eventType: 'order.payment_confirmed',
          payload: {
            order_id: order.id,
            order_number: order.order_number,
            total_amount: order.total_amount,
          },
        },
        manager,
      );

      return order;
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: string,
    reason: string,
    userId?: string,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['line_items'],
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Order already cancelled');
      }

      // Cancel all cancellable line items
      for (const lineItem of order.line_items) {
        if (lineItem.is_cancellable) {
          await this.fsmService.transitionLineItem(
            lineItem.id,
            'cancelled',
            { reason, user_id: userId },
            manager,
          );
        }
      }

      // Update order status
      order.status = OrderStatus.CANCELLED;
      await manager.save(order);

      // Emit event
      await this.outboxService.addEvent(
        {
          aggregateId: order.id,
          aggregateType: AggregateType.ORDER,
          eventType: 'order.cancelled',
          payload: {
            order_id: order.id,
            order_number: order.order_number,
            reason,
          },
        },
        manager,
      );

      return order;
    });
  }

  /**
   * Initialize fulfillment data based on item type
   */
  private initializeFulfillmentData(cartItem: CartItemSnapshot): any {
    switch (cartItem.type) {
      case 'physical':
        return {
          warehouse_id: null,
          tracking_number: null,
          carrier: null,
          estimated_delivery: null,
        };
      case 'digital':
        return {
          download_url: null,
          access_key: null,
          expires_at: null,
        };
      case 'service':
        return {
          booking_id: cartItem.metadata?.booking_id,
          booking_date: cartItem.metadata?.booking_date,
          booking_slot: cartItem.metadata?.booking_slot,
          specialist_id: cartItem.metadata?.specialist_id,
        };
      default:
        return {};
    }
  }

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(manager): Promise<string> {
    const result = await manager.query('SELECT generate_order_number() as order_number');
    return result[0].order_number;
  }
}
