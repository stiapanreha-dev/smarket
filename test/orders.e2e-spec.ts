import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { OrdersModule } from '../src/modules/orders/orders.module';
import { Order, OrderStatus } from '../src/database/entities/order.entity';
import { OrderLineItem, LineItemType, PhysicalItemStatus } from '../src/database/entities/order-line-item.entity';
import { CheckoutSession, CheckoutStatus } from '../src/database/entities/checkout-session.entity';

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;
  let checkoutSessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT) || 5432,
          username: process.env.DB_USERNAME || 'test',
          password: process.env.DB_PASSWORD || 'test',
          database: process.env.DB_DATABASE || 'smarket_test',
          entities: [__dirname + '/../src/database/entities/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true,
        }),
        OrdersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /api/v1/orders - Create Order', () => {
    beforeEach(async () => {
      // Create test user and checkout session
      userId = 'test-user-1';

      const checkout = dataSource.getRepository(CheckoutSession).create({
        user_id: userId,
        cart_snapshot: [
          {
            productId: 'prod-1',
            variantId: 'variant-1',
            quantity: 2,
            price: 2000,
            currency: 'USD',
            merchantId: 'merchant-1',
            type: 'physical',
            productName: 'Test Product',
            sku: 'TEST-001',
          },
        ],
        step: 'payment',
        status: CheckoutStatus.IN_PROGRESS,
        totals: {
          subtotal: 4000,
          tax_amount: 400,
          shipping_amount: 500,
          discount_amount: 0,
          total_amount: 4900,
          currency: 'USD',
        },
        expires_at: new Date(Date.now() + 30 * 60 * 1000),
      });

      const saved = await dataSource.getRepository(CheckoutSession).save(checkout);
      checkoutSessionId = saved.id;

      // Mock auth token
      authToken = 'Bearer test-token';
    });

    it('should create order from checkout session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send({
          checkout_session_id: checkoutSessionId,
          payment_intent_id: 'pi_test_123',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('order_number');
      expect(response.body.data.status).toBe(OrderStatus.PENDING);
      expect(response.body.data.total_amount).toBe(4900);
      expect(response.body.data.line_items).toHaveLength(1);

      // Verify checkout session is completed
      const checkout = await dataSource
        .getRepository(CheckoutSession)
        .findOne({ where: { id: checkoutSessionId } });
      expect(checkout.status).toBe(CheckoutStatus.COMPLETED);
      expect(checkout.order_id).toBe(response.body.data.id);
    });

    it('should reject if checkout session already has order', async () => {
      // Create order first
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send({
          checkout_session_id: checkoutSessionId,
        })
        .expect(201);

      // Try to create again
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', authToken)
        .send({
          checkout_session_id: checkoutSessionId,
        })
        .expect(400);
    });
  });

  describe('GET /api/v1/orders - List Orders', () => {
    beforeEach(async () => {
      // Create test orders
      const order1 = dataSource.getRepository(Order).create({
        order_number: 'ORD-TEST-001',
        user_id: userId,
        status: OrderStatus.PENDING,
        currency: 'USD',
        subtotal: 4000,
        tax_amount: 400,
        shipping_amount: 500,
        discount_amount: 0,
        total_amount: 4900,
        payment_status: 'pending',
      });

      await dataSource.getRepository(Order).save(order1);
    });

    it('should return user orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders?status=pending')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every((o) => o.status === 'pending')).toBe(true);
    });
  });

  describe('Line Item FSM Transitions', () => {
    let orderId: string;
    let lineItemId: string;

    beforeEach(async () => {
      // Create order with line item
      const order = await dataSource.getRepository(Order).save({
        order_number: 'ORD-FSM-TEST',
        user_id: userId,
        status: OrderStatus.PENDING,
        currency: 'USD',
        subtotal: 2000,
        tax_amount: 200,
        shipping_amount: 300,
        discount_amount: 0,
        total_amount: 2500,
        payment_status: 'pending',
      });

      orderId = order.id;

      const lineItem = await dataSource.getRepository(OrderLineItem).save({
        order_id: orderId,
        merchant_id: 'merchant-1',
        product_id: 'product-1',
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.PENDING,
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 2000,
        total_price: 2000,
        currency: 'USD',
        fulfillment_data: {},
        status_history: [{ to: 'pending', timestamp: new Date() }],
      });

      lineItemId = lineItem.id;
    });

    it('should transition through physical item lifecycle', async () => {
      // pending -> payment_confirmed
      let lineItem = await dataSource.getRepository(OrderLineItem).findOne({
        where: { id: lineItemId },
      });
      expect(lineItem.status).toBe(PhysicalItemStatus.PENDING);

      // Simulate transitions
      lineItem.status = PhysicalItemStatus.PAYMENT_CONFIRMED;
      await dataSource.getRepository(OrderLineItem).save(lineItem);

      lineItem = await dataSource.getRepository(OrderLineItem).findOne({
        where: { id: lineItemId },
      });
      expect(lineItem.status).toBe(PhysicalItemStatus.PAYMENT_CONFIRMED);

      // payment_confirmed -> preparing
      lineItem.status = PhysicalItemStatus.PREPARING;
      await dataSource.getRepository(OrderLineItem).save(lineItem);

      lineItem = await dataSource.getRepository(OrderLineItem).findOne({
        where: { id: lineItemId },
      });
      expect(lineItem.status).toBe(PhysicalItemStatus.PREPARING);
    });
  });

  describe('Order Cancellation', () => {
    let orderId: string;

    beforeEach(async () => {
      const order = await dataSource.getRepository(Order).save({
        order_number: 'ORD-CANCEL-TEST',
        user_id: userId,
        status: OrderStatus.PENDING,
        currency: 'USD',
        subtotal: 1000,
        tax_amount: 100,
        shipping_amount: 200,
        discount_amount: 0,
        total_amount: 1300,
        payment_status: 'pending',
      });

      orderId = order.id;

      await dataSource.getRepository(OrderLineItem).save({
        order_id: orderId,
        merchant_id: 'merchant-1',
        product_id: 'product-1',
        type: LineItemType.PHYSICAL,
        status: PhysicalItemStatus.PENDING,
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 1000,
        total_price: 1000,
        currency: 'USD',
        fulfillment_data: {},
        status_history: [],
      });
    });

    it('should cancel order successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${orderId}/cancel`)
        .set('Authorization', authToken)
        .send({
          reason: 'Customer requested cancellation',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(OrderStatus.CANCELLED);

      // Verify line items are cancelled
      const lineItems = await dataSource.getRepository(OrderLineItem).find({
        where: { order_id: orderId },
      });

      expect(lineItems.every((li) => li.status === 'cancelled')).toBe(true);
    });
  });
});
