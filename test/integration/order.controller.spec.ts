import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { OrderController } from '../../src/modules/orders/controllers/order.controller';
import { OrderService } from '../../src/modules/orders/services/order.service';
import { getTestDataSource } from '../setup';
import {
  createTestUser,
  createTestMerchant,
  createTestProduct,
  createTestCheckoutSession,
  createTestOrder,
  createTestLineItem,
} from '../utils/test-helpers';
import { testUsers, testAddresses } from '../fixtures/users.fixture';

describe('OrderController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let testUser: any;
  let testMerchant: any;
  let testProduct: any;
  let accessToken: string;

  beforeAll(async () => {
    dataSource = getTestDataSource();

    // Create test user, merchant, and product
    testUser = await createTestUser(dataSource, testUsers.buyer);
    const merchantUser = await createTestUser(dataSource, testUsers.merchant);
    testMerchant = await createTestMerchant(dataSource, merchantUser.id);
    testProduct = await createTestProduct(dataSource, testMerchant.id, {
      name: 'Test Product',
      type: 'physical',
      price: 2999,
      currency: 'USD',
      sku: 'TEST-PROD-001',
      stock_quantity: 100,
    });
  });

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [OrderController],
      providers: [
        OrderService,
        // Add all required providers here - simplified for example
        // In real implementation, you'd import the entire module or mock dependencies
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    jwtService = moduleRef.get<JwtService>(JwtService);
    accessToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/orders', () => {
    it('should create order from checkout session', async () => {
      // Create checkout session
      const checkoutSession = await createTestCheckoutSession(dataSource, testUser.id, {
        currency: 'USD',
        cart_snapshot: [
          {
            productId: testProduct.id,
            merchantId: testMerchant.id,
            productName: testProduct.name,
            sku: testProduct.sku,
            type: 'physical',
            quantity: 1,
            price: 2999,
            currency: 'USD',
          },
        ],
        totals: {
          subtotal: 2999,
          tax_amount: 300,
          shipping_amount: 500,
          discount_amount: 0,
          total_amount: 3799,
          currency: 'USD',
        },
        shipping_address: testAddresses.usAddress,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: checkoutSession.id,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          order_number: expect.any(String),
          status: 'pending',
          total_amount: 3799,
          line_items: expect.arrayContaining([
            expect.objectContaining({
              status: 'pending',
              type: 'physical',
              quantity: 1,
            }),
          ]),
        }),
      });

      // Verify order was created in database
      const order = await dataSource.query(
        'SELECT * FROM orders WHERE id = $1',
        [response.body.data.id]
      );
      expect(order).toHaveLength(1);
      expect(order[0].user_id).toBe(testUser.id);
    });

    it('should return 404 if checkout session not found', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: '00000000-0000-0000-0000-000000000000',
        })
        .expect(404);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({
          checkout_session_id: 'session-id',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/orders', () => {
    beforeEach(async () => {
      // Create test orders
      for (let i = 0; i < 3; i++) {
        const order = await createTestOrder(dataSource, testUser.id, {
          currency: 'USD',
          total_amount: 3799,
          status: 'pending',
        });

        await createTestLineItem(dataSource, order.id, testMerchant.id, testProduct.id, {
          type: 'physical',
          quantity: 1,
          unit_price: 2999,
          product_name: testProduct.name,
          product_sku: testProduct.sku,
        });
      }
    });

    it('should return paginated user orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        meta: expect.objectContaining({
          page: 1,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter orders by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .query({ status: 'pending' })
        .expect(200);

      expect(response.body.data.every((order: any) => order.status === 'pending')).toBe(true);
    });
  });

  describe('GET /api/v1/orders/:orderNumber', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await createTestOrder(dataSource, testUser.id, {
        currency: 'USD',
        total_amount: 3799,
      });
    });

    it('should return order by order number', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrder.order_number}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          order_number: testOrder.order_number,
          user_id: testUser.id,
        }),
      });
    });

    it('should return 403 if user does not own the order', async () => {
      const otherUser = await createTestUser(dataSource, {
        email: 'other@test.com',
        password: 'Test123!@#',
      });
      const otherUserToken = jwtService.sign({
        sub: otherUser.id,
        email: otherUser.email,
      });

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${testOrder.order_number}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);
    });

    it('should return 404 if order not found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders/INVALID-ORDER-NUMBER')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/v1/orders/:orderId/cancel', () => {
    let testOrder: any;

    beforeEach(async () => {
      testOrder = await createTestOrder(dataSource, testUser.id, {
        currency: 'USD',
        total_amount: 3799,
        status: 'pending',
      });

      await createTestLineItem(dataSource, testOrder.id, testMerchant.id, testProduct.id, {
        type: 'physical',
        quantity: 1,
        unit_price: 2999,
        product_name: testProduct.name,
        product_sku: testProduct.sku,
      });
    });

    it('should cancel order successfully', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'Customer request',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Order cancelled successfully',
        data: expect.objectContaining({
          id: testOrder.id,
          status: 'cancelled',
        }),
      });
    });

    it('should return 403 if user does not own the order', async () => {
      const otherUser = await createTestUser(dataSource, {
        email: 'other2@test.com',
        password: 'Test123!@#',
      });
      const otherUserToken = jwtService.sign({
        sub: otherUser.id,
        email: otherUser.email,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/orders/${testOrder.id}/cancel`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ reason: 'Test' })
        .expect(403);
    });
  });

  describe('GET /api/v1/orders/:orderNumber/track', () => {
    it('should track order for guest with valid email', async () => {
      const guestOrder = await createTestOrder(dataSource, null, {
        currency: 'USD',
        total_amount: 3799,
        shipping_address: testAddresses.usAddress,
      });

      // Update order to be guest order
      await dataSource.query(
        'UPDATE orders SET user_id = NULL, guest_email = $1 WHERE id = $2',
        ['guest@test.com', guestOrder.id]
      );

      await createTestLineItem(dataSource, guestOrder.id, testMerchant.id, testProduct.id, {
        type: 'physical',
        quantity: 1,
        unit_price: 2999,
        product_name: testProduct.name,
        product_sku: testProduct.sku,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${guestOrder.order_number}/track`)
        .query({ email: 'guest@test.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          order_number: guestOrder.order_number,
          status: expect.any(String),
          line_items: expect.any(Array),
        }),
      });
    });

    it('should return 403 for guest order with invalid email', async () => {
      const guestOrder = await createTestOrder(dataSource, null, {
        currency: 'USD',
        total_amount: 3799,
      });

      await dataSource.query(
        'UPDATE orders SET user_id = NULL, guest_email = $1 WHERE id = $2',
        ['guest@test.com', guestOrder.id]
      );

      await request(app.getHttpServer())
        .get(`/api/v1/orders/${guestOrder.order_number}/track`)
        .query({ email: 'wrong@test.com' })
        .expect(403);
    });
  });
});
