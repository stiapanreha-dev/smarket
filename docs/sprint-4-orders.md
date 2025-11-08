# Sprint 4: Orders Management
## Order Processing System (День 21-25)

**Dates:** 12-16 Февраля 2024  
**Goal:** Реализовать систему управления заказами с FSM для разных типов товаров  
**Team Focus:** Backend - 70%, Frontend - 30%  

---

## 🎯 Sprint Goals

1. **Order Creation** - Создание заказов из checkout
2. **Line Item FSM** - Отдельные состояния для каждого типа товара
3. **Order Tracking** - Отслеживание статуса заказа
4. **Merchant Orders** - Панель продавца для управления заказами
5. **Order History** - История заказов покупателя

---

## 📋 User Stories

### ORD-001: Order Creation & FSM (13 SP)
**As a** system  
**I want** to create orders with proper state management  
**So that** each item type follows its own lifecycle  

**Acceptance Criteria:**
- [ ] Create order from checkout session
- [ ] Line-item based FSM
- [ ] Physical items: inventory confirmation
- [ ] Digital items: instant access
- [ ] Service items: booking confirmation
- [ ] Split orders by merchant

**Database Schema:**
```sql
-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    currency VARCHAR(3) NOT NULL,
    subtotal INTEGER NOT NULL,
    tax_amount INTEGER NOT NULL,
    shipping_amount INTEGER NOT NULL,
    discount_amount INTEGER DEFAULT 0,
    total_amount INTEGER NOT NULL,
    
    -- Guest checkout
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    
    -- Addresses
    shipping_address JSONB,
    billing_address JSONB,
    
    -- Payment info
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    checkout_session_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_created (created_at DESC)
);

-- Order line items
CREATE TABLE order_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id),
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    type VARCHAR(20) NOT NULL, -- physical, digital, service
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Product snapshot
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(100),
    variant_attributes JSONB,
    
    -- Pricing
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL,
    
    -- Fulfillment
    fulfillment_status VARCHAR(50),
    fulfillment_data JSONB, -- tracking, download link, booking info
    
    -- FSM tracking
    status_history JSONB DEFAULT '[]',
    last_status_change TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_line_items_order (order_id),
    INDEX idx_line_items_merchant (merchant_id),
    INDEX idx_line_items_status (status),
    INDEX idx_line_items_type (type)
);

-- Order status transitions
CREATE TABLE order_status_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    line_item_id UUID REFERENCES order_line_items(id) ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    reason TEXT,
    metadata JSONB,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_transitions_order (order_id),
    INDEX idx_transitions_line_item (line_item_id)
);

-- Outbox for order events
CREATE TABLE order_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_id UUID NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    INDEX idx_outbox_status (status, created_at)
);
```

**Backend Implementation:**
```typescript
// src/modules/orders/entities/order-line-item.entity.ts
export enum PhysicalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  PREPARING = 'preparing',
  READY_TO_SHIP = 'ready_to_ship',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded'
}

export enum DigitalItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  ACCESS_GRANTED = 'access_granted',
  DOWNLOADED = 'downloaded',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded'
}

export enum ServiceItemStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  BOOKING_CONFIRMED = 'booking_confirmed',
  REMINDER_SENT = 'reminder_sent',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  REFUND_REQUESTED = 'refund_requested',
  REFUNDED = 'refunded'
}

// src/modules/orders/services/order-fsm.service.ts
@Injectable()
export class OrderFSMService {
  private readonly transitions = {
    physical: {
      [PhysicalItemStatus.PENDING]: [PhysicalItemStatus.PAYMENT_CONFIRMED, PhysicalItemStatus.CANCELLED],
      [PhysicalItemStatus.PAYMENT_CONFIRMED]: [PhysicalItemStatus.PREPARING, PhysicalItemStatus.CANCELLED],
      [PhysicalItemStatus.PREPARING]: [PhysicalItemStatus.READY_TO_SHIP, PhysicalItemStatus.CANCELLED],
      [PhysicalItemStatus.READY_TO_SHIP]: [PhysicalItemStatus.SHIPPED],
      [PhysicalItemStatus.SHIPPED]: [PhysicalItemStatus.OUT_FOR_DELIVERY, PhysicalItemStatus.DELIVERED],
      [PhysicalItemStatus.OUT_FOR_DELIVERY]: [PhysicalItemStatus.DELIVERED],
      [PhysicalItemStatus.DELIVERED]: [PhysicalItemStatus.REFUND_REQUESTED],
      [PhysicalItemStatus.REFUND_REQUESTED]: [PhysicalItemStatus.REFUNDED],
    },
    digital: {
      [DigitalItemStatus.PENDING]: [DigitalItemStatus.PAYMENT_CONFIRMED, DigitalItemStatus.CANCELLED],
      [DigitalItemStatus.PAYMENT_CONFIRMED]: [DigitalItemStatus.ACCESS_GRANTED, DigitalItemStatus.CANCELLED],
      [DigitalItemStatus.ACCESS_GRANTED]: [DigitalItemStatus.DOWNLOADED, DigitalItemStatus.REFUND_REQUESTED],
      [DigitalItemStatus.DOWNLOADED]: [DigitalItemStatus.REFUND_REQUESTED],
      [DigitalItemStatus.REFUND_REQUESTED]: [DigitalItemStatus.REFUNDED],
    },
    service: {
      [ServiceItemStatus.PENDING]: [ServiceItemStatus.PAYMENT_CONFIRMED, ServiceItemStatus.CANCELLED],
      [ServiceItemStatus.PAYMENT_CONFIRMED]: [ServiceItemStatus.BOOKING_CONFIRMED, ServiceItemStatus.CANCELLED],
      [ServiceItemStatus.BOOKING_CONFIRMED]: [ServiceItemStatus.REMINDER_SENT, ServiceItemStatus.CANCELLED],
      [ServiceItemStatus.REMINDER_SENT]: [ServiceItemStatus.IN_PROGRESS, ServiceItemStatus.NO_SHOW],
      [ServiceItemStatus.IN_PROGRESS]: [ServiceItemStatus.COMPLETED],
      [ServiceItemStatus.COMPLETED]: [ServiceItemStatus.REFUND_REQUESTED],
      [ServiceItemStatus.NO_SHOW]: [ServiceItemStatus.REFUND_REQUESTED],
      [ServiceItemStatus.REFUND_REQUESTED]: [ServiceItemStatus.REFUNDED],
    },
  };

  canTransition(
    itemType: 'physical' | 'digital' | 'service',
    fromStatus: string,
    toStatus: string,
  ): boolean {
    const allowedTransitions = this.transitions[itemType][fromStatus];
    return allowedTransitions?.includes(toStatus) || false;
  }

  async transitionLineItem(
    lineItem: OrderLineItem,
    toStatus: string,
    metadata?: any,
  ): Promise<OrderLineItem> {
    if (!this.canTransition(lineItem.type, lineItem.status, toStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${lineItem.status} to ${toStatus} for ${lineItem.type} item`,
      );
    }

    const previousStatus = lineItem.status;
    lineItem.status = toStatus;
    lineItem.lastStatusChange = new Date();
    
    // Add to status history
    lineItem.statusHistory = [
      ...lineItem.statusHistory,
      {
        from: previousStatus,
        to: toStatus,
        timestamp: new Date(),
        metadata,
      },
    ];

    // Handle side effects based on status
    await this.handleStatusSideEffects(lineItem, previousStatus, toStatus);

    return lineItem;
  }

  private async handleStatusSideEffects(
    lineItem: OrderLineItem,
    fromStatus: string,
    toStatus: string,
  ): Promise<void> {
    // Physical item side effects
    if (lineItem.type === 'physical') {
      if (toStatus === PhysicalItemStatus.PAYMENT_CONFIRMED) {
        await this.inventoryService.confirmReservation(lineItem.variantId, lineItem.quantity);
      } else if (toStatus === PhysicalItemStatus.SHIPPED) {
        await this.notificationService.sendShipmentNotification(lineItem);
      } else if (toStatus === PhysicalItemStatus.CANCELLED) {
        await this.inventoryService.releaseInventory(lineItem.variantId, lineItem.quantity);
      }
    }

    // Digital item side effects
    else if (lineItem.type === 'digital') {
      if (toStatus === DigitalItemStatus.ACCESS_GRANTED) {
        const accessData = await this.digitalService.grantAccess(lineItem);
        lineItem.fulfillmentData = { ...lineItem.fulfillmentData, ...accessData };
      }
    }

    // Service item side effects
    else if (lineItem.type === 'service') {
      if (toStatus === ServiceItemStatus.BOOKING_CONFIRMED) {
        await this.bookingService.confirmBooking(lineItem.fulfillmentData.bookingId);
      } else if (toStatus === ServiceItemStatus.REMINDER_SENT) {
        await this.notificationService.sendBookingReminder(lineItem);
      } else if (toStatus === ServiceItemStatus.CANCELLED) {
        await this.bookingService.cancelBooking(lineItem.fulfillmentData.bookingId);
      }
    }
  }
}

// src/modules/orders/services/order.service.ts
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderLineItem)
    private lineItemRepository: Repository<OrderLineItem>,
    private readonly fsmService: OrderFSMService,
    private readonly inventoryService: InventoryService,
    private readonly outboxService: OutboxService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrderFromCheckout(
    checkoutSession: CheckoutSession,
    paymentIntentId: string,
  ): Promise<Order> {
    return await this.orderRepository.manager.transaction(async manager => {
      const cart = checkoutSession.cartSnapshot as Cart;
      
      // Create order
      const order = manager.create(Order, {
        orderNumber: this.generateOrderNumber(),
        userId: checkoutSession.userId,
        status: 'pending',
        currency: cart.items[0]?.currency || 'USD',
        subtotal: this.calculateSubtotal(cart.items),
        taxAmount: checkoutSession.taxAmount,
        shippingAmount: checkoutSession.shippingMethod?.price || 0,
        discountAmount: 0,
        totalAmount: checkoutSession.total,
        guestEmail: checkoutSession.guestEmail,
        guestPhone: checkoutSession.guestPhone,
        shippingAddress: checkoutSession.shippingAddress,
        billingAddress: checkoutSession.billingAddress || checkoutSession.shippingAddress,
        paymentMethod: checkoutSession.paymentMethod,
        paymentStatus: 'pending',
        checkoutSessionId: checkoutSession.id,
        metadata: {
          paymentIntentId,
          ip: checkoutSession.metadata?.ip,
          userAgent: checkoutSession.metadata?.userAgent,
        },
      });

      await manager.save(order);

      // Create line items grouped by type
      const lineItems: OrderLineItem[] = [];
      
      for (const cartItem of cart.items) {
        const lineItem = manager.create(OrderLineItem, {
          orderId: order.id,
          merchantId: cartItem.merchantId,
          productId: cartItem.productId,
          variantId: cartItem.variantId,
          type: cartItem.type,
          status: 'pending',
          productName: cartItem.productName,
          productSku: cartItem.sku,
          variantAttributes: cartItem.variantAttributes,
          quantity: cartItem.quantity,
          unitPrice: cartItem.price,
          totalPrice: cartItem.price * cartItem.quantity,
          currency: cartItem.currency,
          fulfillmentStatus: 'pending',
          fulfillmentData: this.initializeFulfillmentData(cartItem),
          statusHistory: [{
            to: 'pending',
            timestamp: new Date(),
          }],
        });

        lineItems.push(lineItem);
      }

      await manager.save(lineItems);

      // Add event to outbox
      await this.outboxService.addEvent(
        'order.created',
        {
          orderId: order.id,
          userId: order.userId,
          lineItems: lineItems.map(li => ({
            id: li.id,
            type: li.type,
            merchantId: li.merchantId,
          })),
        },
        manager,
      );

      // Confirm inventory reservations for physical items
      const physicalItems = lineItems.filter(li => li.type === 'physical');
      for (const item of physicalItems) {
        await this.inventoryService.confirmReservation(
          item.variantId,
          item.quantity,
          manager,
        );
      }

      return order;
    });
  }

  private initializeFulfillmentData(cartItem: CartItem): any {
    switch (cartItem.type) {
      case 'physical':
        return {
          warehouseId: null,
          trackingNumber: null,
          carrier: null,
          estimatedDelivery: null,
        };
      
      case 'digital':
        return {
          downloadUrl: null,
          accessKey: null,
          expiresAt: null,
        };
      
      case 'service':
        return {
          bookingId: cartItem.metadata?.bookingId,
          bookingDate: cartItem.metadata?.bookingDate,
          bookingSlot: cartItem.metadata?.bookingSlot,
          specialistId: cartItem.metadata?.specialistId,
        };
      
      default:
        return {};
    }
  }

  async updateLineItemStatus(
    orderId: string,
    lineItemId: string,
    newStatus: string,
    metadata?: any,
  ): Promise<OrderLineItem> {
    const lineItem = await this.lineItemRepository.findOne({
      where: {
        id: lineItemId,
        orderId: orderId,
      },
    });

    if (!lineItem) {
      throw new NotFoundException('Line item not found');
    }

    // Use FSM to transition status
    const updatedItem = await this.fsmService.transitionLineItem(
      lineItem,
      newStatus,
      metadata,
    );

    await this.lineItemRepository.save(updatedItem);

    // Add transition record
    await this.transitionRepository.save({
      orderId: orderId,
      lineItemId: lineItemId,
      fromStatus: lineItem.status,
      toStatus: newStatus,
      metadata,
    });

    // Emit event
    await this.outboxService.addEvent(
      'order.line_item.status_changed',
      {
        orderId,
        lineItemId,
        fromStatus: lineItem.status,
        toStatus: newStatus,
        itemType: lineItem.type,
      },
    );

    // Update order status if needed
    await this.updateOrderStatus(orderId);

    return updatedItem;
  }

  private async updateOrderStatus(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['lineItems'],
    });

    if (!order) return;

    // Determine order status based on line items
    const statuses = order.lineItems.map(li => li.status);
    
    let newStatus: string;
    if (statuses.every(s => s === 'cancelled')) {
      newStatus = 'cancelled';
    } else if (statuses.every(s => s === 'delivered' || s === 'completed' || s === 'downloaded')) {
      newStatus = 'completed';
    } else if (statuses.some(s => s.includes('shipped') || s === 'in_progress')) {
      newStatus = 'processing';
    } else if (statuses.every(s => s === 'payment_confirmed')) {
      newStatus = 'confirmed';
    } else {
      newStatus = 'pending';
    }

    if (order.status !== newStatus) {
      order.status = newStatus;
      order.updatedAt = new Date();
      await this.orderRepository.save(order);
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}
```

---

### ORD-002: Order Tracking & History (8 SP)
**As a** customer  
**I want** to track my orders  
**So that** I know when to expect delivery  

**Acceptance Criteria:**
- [ ] Order list with filters
- [ ] Order detail page
- [ ] Real-time status updates
- [ ] Download invoice
- [ ] Cancel/refund request

**Implementation:**
```typescript
// src/modules/orders/controllers/order.controller.ts
@Controller('orders')
@ApiTags('Orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly pdfService: PdfService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user orders' })
  async getUserOrders(
    @CurrentUser() user: User,
    @Query() query: GetOrdersDto,
  ) {
    return this.orderService.getUserOrders(user.id, query);
  }

  @Get(':orderNumber')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: User,
  ) {
    const order = await this.orderService.getOrderByNumber(orderNumber);
    
    // Check access
    if (order.userId !== user.id && !user.roles.includes('admin')) {
      throw new ForbiddenException();
    }

    return order;
  }

  @Get(':orderNumber/track')
  @ApiOperation({ summary: 'Track order (public)' })
  async trackOrder(
    @Param('orderNumber') orderNumber: string,
    @Query('email') email: string,
  ) {
    const order = await this.orderService.getOrderByNumber(orderNumber);
    
    // Verify email for guest orders
    if (order.guestEmail && order.guestEmail !== email) {
      throw new ForbiddenException('Invalid email');
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      estimatedDelivery: this.calculateEstimatedDelivery(order),
      trackingEvents: await this.getTrackingEvents(order),
    };
  }

  @Get(':orderNumber/invoice')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download invoice' })
  async downloadInvoice(
    @Param('orderNumber') orderNumber: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const order = await this.orderService.getOrderByNumber(orderNumber);
    
    if (order.userId !== user.id) {
      throw new ForbiddenException();
    }

    const pdf = await this.pdfService.generateInvoice(order);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${orderNumber}.pdf"`,
    });
    
    res.send(pdf);
  }

  @Post(':orderId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel order' })
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() cancelDto: CancelOrderDto,
    @CurrentUser() user: User,
  ) {
    const order = await this.orderService.getOrder(orderId);
    
    if (order.userId !== user.id) {
      throw new ForbiddenException();
    }

    // Check if cancellation is allowed
    if (!this.canCancelOrder(order)) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    return this.orderService.cancelOrder(orderId, cancelDto.reason);
  }

  private canCancelOrder(order: Order): boolean {
    // Can cancel if all items are still in early stages
    const cancellableStatuses = ['pending', 'payment_confirmed', 'preparing'];
    return order.lineItems.every(item => 
      cancellableStatuses.includes(item.status)
    );
  }

  private calculateEstimatedDelivery(order: Order): Date | null {
    const physicalItems = order.lineItems.filter(li => li.type === 'physical');
    if (physicalItems.length === 0) return null;

    // Get the latest estimated delivery
    const deliveryDates = physicalItems
      .map(item => item.fulfillmentData?.estimatedDelivery)
      .filter(date => date)
      .map(date => new Date(date));

    if (deliveryDates.length === 0) {
      // Default estimate
      const days = order.shippingMethod?.estimatedDays?.max || 7;
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    // Return the latest date
    return new Date(Math.max(...deliveryDates.map(d => d.getTime())));
  }
}

// src/modules/orders/services/order-query.service.ts
@Injectable()
export class OrderQueryService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getUserOrders(
    userId: string,
    query: GetOrdersDto,
  ): Promise<PaginatedResult<Order>> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.lineItems', 'lineItem')
      .leftJoinAndSelect('lineItem.product', 'product')
      .leftJoinAndSelect('product.translations', 'translation')
      .where('order.userId = :userId', { userId });

    // Apply filters
    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('order.createdAt >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('order.createdAt <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.search) {
      qb.andWhere(
        '(order.orderNumber ILIKE :search OR translation.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    // Sorting
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`order.${sortField}`, sortOrder);

    // Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const offset = (page - 1) * limit;

    qb.skip(offset).take(limit);

    const [orders, total] = await qb.getManyAndCount();

    return {
      data: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrderStats(userId: string): Promise<OrderStats> {
    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .select('COUNT(*)', 'totalOrders')
      .addSelect('SUM(CASE WHEN status = \'pending\' THEN 1 ELSE 0 END)', 'pendingOrders')
      .addSelect('SUM(CASE WHEN status = \'processing\' THEN 1 ELSE 0 END)', 'processingOrders')
      .addSelect('SUM(CASE WHEN status = \'completed\' THEN 1 ELSE 0 END)', 'completedOrders')
      .addSelect('SUM(total_amount)', 'totalSpent')
      .where('user_id = :userId', { userId })
      .getRawOne();

    return {
      totalOrders: parseInt(stats.totalOrders) || 0,
      pendingOrders: parseInt(stats.pendingOrders) || 0,
      processingOrders: parseInt(stats.processingOrders) || 0,
      completedOrders: parseInt(stats.completedOrders) || 0,
      totalSpent: parseInt(stats.totalSpent) || 0,
    };
  }
}
```

---

### ORD-003: Merchant Order Management (8 SP)
**As a** merchant  
**I want** to manage orders for my products  
**So that** I can fulfill them  

**Acceptance Criteria:**
- [ ] View orders for merchant's products
- [ ] Update fulfillment status
- [ ] Add tracking information
- [ ] Print packing slip
- [ ] View earnings

**Implementation:**
```typescript
// src/modules/merchant/controllers/merchant-order.controller.ts
@Controller('merchant/orders')
@ApiTags('Merchant Orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MERCHANT)
export class MerchantOrderController {
  constructor(
    private readonly merchantOrderService: MerchantOrderService,
    private readonly fulfillmentService: FulfillmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get merchant orders' })
  async getMerchantOrders(
    @CurrentUser() user: User,
    @Query() query: GetMerchantOrdersDto,
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    return this.merchantOrderService.getMerchantOrders(merchant.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get merchant order statistics' })
  async getMerchantStats(
    @CurrentUser() user: User,
    @Query('period') period: 'day' | 'week' | 'month' = 'month',
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    return this.merchantOrderService.getMerchantStats(merchant.id, period);
  }

  @Get(':orderId/items')
  @ApiOperation({ summary: 'Get merchant items in order' })
  async getMerchantOrderItems(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    return this.merchantOrderService.getMerchantOrderItems(orderId, merchant.id);
  }

  @Patch(':orderId/items/:itemId/fulfill')
  @ApiOperation({ summary: 'Update fulfillment status' })
  async updateFulfillmentStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateFulfillmentDto,
    @CurrentUser() user: User,
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    
    // Verify merchant owns this item
    await this.verifyMerchantOwnership(itemId, merchant.id);
    
    return this.fulfillmentService.updateFulfillment(
      orderId,
      itemId,
      updateDto,
    );
  }

  @Post(':orderId/items/:itemId/shipping')
  @ApiOperation({ summary: 'Add shipping information' })
  async addShippingInfo(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() shippingDto: AddShippingInfoDto,
    @CurrentUser() user: User,
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    await this.verifyMerchantOwnership(itemId, merchant.id);
    
    return this.fulfillmentService.addShippingInfo(
      orderId,
      itemId,
      shippingDto,
    );
  }

  @Get(':orderId/packing-slip')
  @ApiOperation({ summary: 'Generate packing slip' })
  async getPackingSlip(
    @Param('orderId') orderId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const merchant = await this.merchantService.getMerchantByUserId(user.id);
    const items = await this.merchantOrderService.getMerchantOrderItems(
      orderId,
      merchant.id,
    );
    
    if (items.length === 0) {
      throw new ForbiddenException('No items for this merchant in order');
    }
    
    const pdf = await this.pdfService.generatePackingSlip(orderId, items);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="packing-slip-${orderId}.pdf"`,
    });
    
    res.send(pdf);
  }

  private async verifyMerchantOwnership(
    itemId: string,
    merchantId: string,
  ): Promise<void> {
    const item = await this.lineItemRepository.findOne({
      where: { id: itemId, merchantId: merchantId },
    });
    
    if (!item) {
      throw new ForbiddenException('Item not found or not owned by merchant');
    }
  }
}

// src/modules/merchant/services/merchant-order.service.ts
@Injectable()
export class MerchantOrderService {
  constructor(
    @InjectRepository(OrderLineItem)
    private lineItemRepository: Repository<OrderLineItem>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getMerchantOrders(
    merchantId: string,
    query: GetMerchantOrdersDto,
  ): Promise<PaginatedResult<MerchantOrderView>> {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.lineItems', 'lineItem')
      .where('lineItem.merchantId = :merchantId', { merchantId })
      .groupBy('order.id')
      .having('COUNT(lineItem.id) > 0');

    // Apply filters
    if (query.status) {
      qb.andWhere('order.status = :status', { status: query.status });
    }

    if (query.fulfillmentStatus) {
      qb.andWhere('lineItem.fulfillmentStatus = :fulfillmentStatus', {
        fulfillmentStatus: query.fulfillmentStatus,
      });
    }

    // Get unique orders
    const [orders, total] = await qb.getManyAndCount();

    // Get merchant items for each order
    const orderIds = orders.map(o => o.id);
    const merchantItems = await this.lineItemRepository.find({
      where: {
        orderId: In(orderIds),
        merchantId: merchantId,
      },
      relations: ['order'],
    });

    // Group items by order
    const itemsByOrder = _.groupBy(merchantItems, 'orderId');

    // Create merchant order views
    const merchantOrders = orders.map(order => ({
      order,
      merchantItems: itemsByOrder[order.id] || [],
      merchantRevenue: this.calculateMerchantRevenue(itemsByOrder[order.id] || []),
    }));

    return {
      data: merchantOrders,
      total,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages: Math.ceil(total / (query.limit || 20)),
    };
  }

  async getMerchantStats(
    merchantId: string,
    period: 'day' | 'week' | 'month',
  ): Promise<MerchantStats> {
    const startDate = this.getStartDate(period);
    
    const stats = await this.lineItemRepository
      .createQueryBuilder('item')
      .select('COUNT(DISTINCT item.orderId)', 'totalOrders')
      .addSelect('COUNT(item.id)', 'totalItems')
      .addSelect('SUM(item.totalPrice)', 'totalRevenue')
      .addSelect('SUM(CASE WHEN item.status = \'pending\' THEN 1 ELSE 0 END)', 'pendingItems')
      .addSelect('SUM(CASE WHEN item.status = \'preparing\' THEN 1 ELSE 0 END)', 'preparingItems')
      .addSelect('SUM(CASE WHEN item.status = \'shipped\' THEN 1 ELSE 0 END)', 'shippedItems')
      .where('item.merchantId = :merchantId', { merchantId })
      .andWhere('item.createdAt >= :startDate', { startDate })
      .getRawOne();

    // Calculate commission
    const commissionRate = 0.15; // 15% platform fee
    const totalRevenue = parseInt(stats.totalRevenue) || 0;
    const platformFee = Math.round(totalRevenue * commissionRate);
    const netRevenue = totalRevenue - platformFee;

    return {
      period,
      totalOrders: parseInt(stats.totalOrders) || 0,
      totalItems: parseInt(stats.totalItems) || 0,
      pendingItems: parseInt(stats.pendingItems) || 0,
      preparingItems: parseInt(stats.preparingItems) || 0,
      shippedItems: parseInt(stats.shippedItems) || 0,
      totalRevenue,
      platformFee,
      netRevenue,
    };
  }

  private calculateMerchantRevenue(items: OrderLineItem[]): number {
    const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const commissionRate = 0.15;
    return Math.round(total * (1 - commissionRate));
  }

  private getStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo;
      case 'month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo;
      default:
        return new Date(now.setHours(0, 0, 0, 0));
    }
  }
}
```

---

## 📱 Frontend Components

### Order List Component
```tsx
// src/components/orders/OrderList.tsx
import { useState, useEffect } from 'react';
import { useOrders } from '@/hooks/useOrders';
import { OrderCard } from './OrderCard';
import { OrderFilters } from './OrderFilters';
import { Pagination } from '@/components/common/Pagination';

export function OrderList() {
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  
  const [page, setPage] = useState(1);
  const { orders, loading, error, refetch } = useOrders({ ...filters, page });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">My Orders</h1>
        
        <OrderFilters
          filters={filters}
          onFilterChange={setFilters}
        />
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            {error.message}
          </div>
        ) : orders.data.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No orders found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start shopping to see your orders here
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.data.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
            
            <Pagination
              currentPage={page}
              totalPages={orders.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

// src/components/orders/OrderCard.tsx
export function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation();
  
  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Order #{order.orderNumber}
          </h3>
          <p className="text-sm text-gray-500">
            {format(new Date(order.createdAt), 'PPP')}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded ${statusColor[order.status]}`}>
          {t(`order.status.${order.status}`)}
        </span>
      </div>
      
      <div className="space-y-3">
        {order.lineItems.map(item => (
          <div key={item.id} className="flex items-center">
            <img
              src={item.product.images[0]?.thumbnailUrl}
              alt={item.productName}
              className="h-16 w-16 rounded object-cover"
            />
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {item.productName}
              </p>
              <p className="text-sm text-gray-500">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
              </p>
              {item.type === 'physical' && item.fulfillmentData?.trackingNumber && (
                <p className="text-sm text-blue-600">
                  Track: {item.fulfillmentData.trackingNumber}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <p className="text-lg font-medium">
          Total: {formatCurrency(order.totalAmount, order.currency)}
        </p>
        <div className="space-x-2">
          <a
            href={`/orders/${order.orderNumber}`}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View Details
          </a>
          {order.status === 'completed' && (
            <a
              href={`/orders/${order.orderNumber}/invoice`}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Download Invoice
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## ✅ Sprint Checklist

### Backend
- [ ] Order creation from checkout
- [ ] Line item FSM implementation
- [ ] Order status management
- [ ] Order tracking endpoints
- [ ] Merchant order endpoints
- [ ] Invoice generation
- [ ] Outbox event processing

### Frontend
- [ ] Order list page
- [ ] Order detail page
- [ ] Order tracking
- [ ] Merchant dashboard
- [ ] Status updates UI

### Testing
- [ ] FSM transition tests
- [ ] Order creation tests
- [ ] Merchant access tests
- [ ] Integration tests

---

## 📈 Metrics

- Order creation success rate: > 99%
- Average order processing time: < 2s
- FSM transition accuracy: 100%
- Merchant order visibility: < 1s

---

## 🔄 Next Sprint Preview

**Sprint 5: Payments Integration**
- Payment processing
- Split payments
- Refunds
- Payment webhooks
- Reconciliation

---

**Sprint 4 Complete: Order management system ready! 📦**