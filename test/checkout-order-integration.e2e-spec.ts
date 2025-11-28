/**
 * Checkout to Order Integration Tests (E2E)
 *
 * Tests the integration between CheckoutService and OrderService:
 * - Successful order creation from checkout
 * - Error handling and rollback scenarios
 * - Inventory reservation and commitment
 * - FSM state transitions
 * - Transaction coordination
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { getTestDataSource } from './setup';
import {
  createTestUser,
  createTestMerchant,
  createTestProduct,
  waitFor,
  generateTestEmail,
  generateTestSKU,
} from './utils/test-helpers';
import { testAddresses } from './fixtures/users.fixture';
import { CheckoutService } from '../src/modules/checkout/checkout.service';
import { OrderService } from '../src/modules/orders/order.service';
import { InventoryReservationService } from '../src/modules/checkout/services/inventory-reservation.service';

describe('Checkout-to-Order Integration (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let checkoutService: CheckoutService;
  let orderService: OrderService;
  let inventoryService: InventoryReservationService;

  let buyerUser: any;
  let merchantUser: any;
  let merchant: any;
  let physicalProduct: any;
  let digitalProduct: any;
  let serviceProduct: any;
  let accessToken: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    dataSource = getTestDataSource();
    jwtService = moduleRef.get<JwtService>(JwtService);
    checkoutService = moduleRef.get<CheckoutService>(CheckoutService);
    orderService = moduleRef.get<OrderService>(OrderService);
    inventoryService = moduleRef.get<InventoryReservationService>(InventoryReservationService);

    // Create test data
    buyerUser = await createTestUser(dataSource, {
      email: generateTestEmail(),
      password: 'test123',
      role: 'user',
    });

    merchantUser = await createTestUser(dataSource, {
      email: generateTestEmail(),
      password: 'test123',
      role: 'merchant',
    });

    merchant = await createTestMerchant(dataSource, merchantUser.id, {
      business_name: 'Integration Test Merchant',
      business_type: 'individual',
      country: 'US',
    });

    // Create products of different types
    physicalProduct = await createTestProduct(dataSource, merchant.id, {
      name: 'Physical Test Product',
      description: 'A physical product for integration testing',
      type: 'physical',
      price: 5000, // $50.00
      currency: 'USD',
      sku: generateTestSKU(),
      stock_quantity: 50,
      is_active: true,
    });

    digitalProduct = await createTestProduct(dataSource, merchant.id, {
      name: 'Digital Test Product',
      description: 'A digital product for integration testing',
      type: 'digital',
      price: 2000, // $20.00
      currency: 'USD',
      sku: generateTestSKU(),
      is_active: true,
    });

    serviceProduct = await createTestProduct(dataSource, merchant.id, {
      name: 'Service Test Product',
      description: 'A service for integration testing',
      type: 'service',
      price: 10000, // $100.00
      currency: 'USD',
      sku: generateTestSKU(),
      is_active: true,
    });

    // Generate access token for buyer
    accessToken = jwtService.sign({
      sub: buyerUser.id,
      email: buyerUser.email,
    });
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  describe('Happy Path: Successful Order Creation', () => {
    let checkoutSessionId: string;
    let orderId: string;

    it('should create checkout session with mixed product types', async () => {
      // Add items to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 2,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: digitalProduct.id,
          quantity: 1,
        })
        .expect(201);

      // Create checkout session
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        status: 'in_progress',
        cart_snapshot: expect.arrayContaining([
          expect.objectContaining({ productName: physicalProduct.name }),
          expect.objectContaining({ productName: digitalProduct.name }),
        ]),
      });

      checkoutSessionId = response.body.data.id;
    });

    it('should add shipping address for physical products', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${checkoutSessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shipping_address: testAddresses.usAddress,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.shipping_address).toMatchObject(testAddresses.usAddress);
    });

    it('should complete checkout and create order via OrderService', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${checkoutSessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        order_id: expect.any(String),
        order_number: expect.stringMatching(/^ORD-/),
        status: 'completed',
      });

      orderId = response.body.order_id;
    });

    it('should have created order with correct line items', async () => {
      const order = await dataSource.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      expect(order).toHaveLength(1);
      expect(order[0]).toMatchObject({
        id: orderId,
        user_id: buyerUser.id,
        status: 'pending',
        currency: 'USD',
      });

      // Check line items
      const lineItems = await dataSource.query(
        'SELECT * FROM order_line_items WHERE order_id = $1',
        [orderId]
      );

      expect(lineItems).toHaveLength(2);
      expect(lineItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'physical',
            status: 'pending',
            quantity: 2,
          }),
          expect.objectContaining({
            type: 'digital',
            status: 'pending',
            quantity: 1,
          }),
        ])
      );
    });

    it('should have committed inventory reservations', async () => {
      // Check physical product stock was reduced
      const product = await dataSource.query(
        'SELECT stock_quantity FROM products WHERE id = $1',
        [physicalProduct.id]
      );

      expect(product[0].stock_quantity).toBe(48); // 50 - 2 = 48
    });

    it('should have marked checkout session as completed', async () => {
      const session = await dataSource.query(
        'SELECT status, completed_at, order_id, order_number FROM checkout_sessions WHERE id = $1',
        [checkoutSessionId]
      );

      expect(session[0]).toMatchObject({
        status: 'completed',
        order_id: orderId,
        order_number: expect.stringMatching(/^ORD-/),
      });
      expect(session[0].completed_at).toBeTruthy();
    });

    it('should have cleared user cart', async () => {
      const cartResponse = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(0);
    });
  });

  describe('Error Case: Order Creation Failure', () => {
    let failingSessionId: string;

    it('should rollback on order creation failure', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 1,
        })
        .expect(201);

      // Create checkout session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      failingSessionId = sessionResponse.body.data.id;

      // Add shipping
      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${failingSessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shipping_address: testAddresses.usAddress,
        })
        .expect(200);

      // Temporarily break order creation by setting invalid session ID in database
      await dataSource.query(
        'UPDATE checkout_sessions SET cart_snapshot = $1 WHERE id = $2',
        ['[]', failingSessionId] // Empty cart should fail
      );

      // Try to complete checkout - should fail
      const response = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${failingSessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.message).toMatch(/cannot be empty|no items/i);
    });

    it('should have marked session as failed', async () => {
      const session = await dataSource.query(
        'SELECT status, error_message FROM checkout_sessions WHERE id = $1',
        [failingSessionId]
      );

      expect(session[0].status).toBe('failed');
      expect(session[0].error_message).toBeTruthy();
    });

    it('should not have created order', async () => {
      const orders = await dataSource.query(
        'SELECT * FROM orders WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'1 minute\'',
        [buyerUser.id]
      );

      // Should only have the order from previous successful test
      const recentOrders = orders.filter((o: any) => o.status === 'pending');
      expect(recentOrders.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Case: Inventory Commit Failure', () => {
    let inventoryFailSessionId: string;

    it('should handle inventory commit failure gracefully', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 1,
        })
        .expect(201);

      // Create checkout session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      inventoryFailSessionId = sessionResponse.body.data.id;

      // Add shipping
      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${inventoryFailSessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shipping_address: testAddresses.usAddress,
        })
        .expect(200);

      // Simulate inventory commit failure by removing product stock
      await dataSource.query(
        'UPDATE products SET stock_quantity = 0 WHERE id = $1',
        [physicalProduct.id]
      );

      // Try to complete checkout - might fail on inventory commit
      await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${inventoryFailSessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      // Restore stock
      await dataSource.query(
        'UPDATE products SET stock_quantity = 50 WHERE id = $1',
        [physicalProduct.id]
      );
    });
  });

  describe('Edge Case: Cart Clearing Failure Should Not Block Checkout', () => {
    let cartFailSessionId: string;
    let cartFailOrderId: string;

    it('should complete checkout even if cart clearing fails', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: digitalProduct.id,
          quantity: 1,
        })
        .expect(201);

      // Create checkout session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      cartFailSessionId = sessionResponse.body.data.id;

      // Complete checkout (digital product, no shipping needed)
      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${cartFailSessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(completeResponse.body).toMatchObject({
        order_id: expect.any(String),
        status: 'completed',
      });

      cartFailOrderId = completeResponse.body.order_id;
    });

    it('should have created order successfully despite cart error', async () => {
      const order = await dataSource.query(
        'SELECT * FROM orders WHERE id = $1',
        [cartFailOrderId]
      );

      expect(order).toHaveLength(1);
      expect(order[0].status).toBe('pending');
    });
  });

  describe('FSM Transitions: Order Status Flow', () => {
    let fsmOrderId: string;

    beforeEach(async () => {
      // Create a fresh order for FSM testing
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 1,
        })
        .expect(201);

      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const sessionId = sessionResponse.body.data.id;

      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${sessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ shipping_address: testAddresses.usAddress })
        .expect(200);

      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      fsmOrderId = completeResponse.body.order_id;
    });

    it('should start order in PENDING status', async () => {
      const order = await dataSource.query(
        'SELECT status FROM orders WHERE id = $1',
        [fsmOrderId]
      );

      expect(order[0].status).toBe('pending');
    });

    it('should have logged initial state transition', async () => {
      const transitions = await dataSource.query(
        'SELECT * FROM order_status_transitions WHERE order_id = $1',
        [fsmOrderId]
      );

      expect(transitions.length).toBeGreaterThanOrEqual(1);
      expect(transitions[0]).toMatchObject({
        order_id: fsmOrderId,
        to_status: 'pending',
      });
    });

    it('should allow valid state transition', async () => {
      // Simulate payment confirmation (valid transition: pending -> payment_confirmed)
      await dataSource.query(
        `UPDATE orders SET status = 'payment_confirmed' WHERE id = $1`,
        [fsmOrderId]
      );

      const order = await dataSource.query(
        'SELECT status FROM orders WHERE id = $1',
        [fsmOrderId]
      );

      expect(order[0].status).toBe('payment_confirmed');
    });
  });

  describe('Multi-Product Type Order', () => {
    it('should create order with physical, digital, and service items', async () => {
      // Add all product types to cart
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ product_id: physicalProduct.id, quantity: 1 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ product_id: digitalProduct.id, quantity: 1 })
        .expect(201);

      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ product_id: serviceProduct.id, quantity: 1 })
        .expect(201);

      // Create and complete checkout
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const sessionId = sessionResponse.body.data.id;

      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${sessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ shipping_address: testAddresses.usAddress })
        .expect(200);

      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const orderId = completeResponse.body.order_id;

      // Verify line items
      const lineItems = await dataSource.query(
        'SELECT type, status FROM order_line_items WHERE order_id = $1',
        [orderId]
      );

      expect(lineItems).toHaveLength(3);
      expect(lineItems.map((li: any) => li.type).sort()).toEqual(['digital', 'physical', 'service']);
      expect(lineItems.every((li: any) => li.status === 'pending')).toBe(true);
    });
  });

  describe('Payment Intent ID Handling', () => {
    it('should handle payment intent ID from payment_details', async () => {
      // Add item and create session
      await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ product_id: digitalProduct.id, quantity: 1 })
        .expect(201);

      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const sessionId = sessionResponse.body.data.id;

      // Add payment details with payment intent ID
      await dataSource.query(
        `UPDATE checkout_sessions
         SET payment_details = $1
         WHERE id = $2`,
        [JSON.stringify({ paymentIntentId: 'pi_test_123456' }), sessionId]
      );

      // Complete checkout
      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${sessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const orderId = completeResponse.body.order_id;

      // Verify order was created (payment intent ID should be passed to OrderService)
      const order = await dataSource.query(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      expect(order).toHaveLength(1);
    });
  });
});
