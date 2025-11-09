import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../../src/app.module';
import { getTestDataSource } from '../setup';
import {
  createTestUser,
  createTestMerchant,
  createTestProduct,
} from '../utils/test-helpers';
import { testUsers, testAddresses, testPaymentMethods } from '../fixtures/users.fixture';

describe('Complete Checkout Flow (E2E)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let buyerUser: any;
  let merchantUser: any;
  let merchant: any;
  let physicalProduct: any;
  let digitalProduct: any;
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

    // Create test data
    buyerUser = await createTestUser(dataSource, testUsers.buyer);
    merchantUser = await createTestUser(dataSource, testUsers.merchant);
    merchant = await createTestMerchant(dataSource, merchantUser.id, {
      business_name: 'Test Merchant',
      business_type: 'individual',
      country: 'US',
    });

    physicalProduct = await createTestProduct(dataSource, merchant.id, {
      name: 'Physical Product',
      description: 'A physical product for E2E testing',
      type: 'physical',
      price: 2999,
      currency: 'USD',
      sku: 'E2E-PHYS-001',
      stock_quantity: 100,
    });

    digitalProduct = await createTestProduct(dataSource, merchant.id, {
      name: 'Digital Product',
      description: 'A digital product for E2E testing',
      type: 'digital',
      price: 999,
      currency: 'USD',
      sku: 'E2E-DIGI-001',
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

  describe('Happy Path: Complete Purchase Flow', () => {
    let cartId: string;
    let checkoutSessionId: string;
    let orderId: string;
    let paymentId: string;

    it('Step 1: User browses catalog', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/catalog/products')
        .expect(200);

      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: physicalProduct.id,
            name: 'Physical Product',
            price: 2999,
          }),
        ])
      );
    });

    it('Step 2: User adds items to cart', async () => {
      // Add physical product
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 2,
        })
        .expect(201);

      expect(response1.body.success).toBe(true);

      // Add digital product
      const response2 = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: digitalProduct.id,
          quantity: 1,
        })
        .expect(201);

      expect(response2.body.success).toBe(true);

      // Get cart
      const cartResponse = await request(app.getHttpServer())
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(cartResponse.body.data.items).toHaveLength(2);
      cartId = cartResponse.body.data.id;
    });

    it('Step 3: User initiates checkout', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          status: 'in_progress',
          totals: expect.objectContaining({
            subtotal: expect.any(Number),
            total_amount: expect.any(Number),
          }),
        }),
      });

      checkoutSessionId = response.body.data.id;
    });

    it('Step 4: User adds shipping address', async () => {
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

    it('Step 5: User completes checkout and creates order', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: checkoutSessionId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          order_number: expect.any(String),
          status: 'pending',
          line_items: expect.arrayContaining([
            expect.objectContaining({
              status: 'pending',
              type: expect.stringMatching(/physical|digital/),
            }),
          ]),
        }),
      });

      orderId = response.body.data.id;
    });

    it('Step 6: System creates payment intent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/payments/authorize')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          order_id: orderId,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          status: expect.stringMatching(/pending|authorized/),
          amount_minor: expect.any(Number),
          provider: 'stripe',
        }),
      });

      paymentId = response.body.data.id;
    });

    it('Step 7: Simulate payment success webhook', async () => {
      // Simulate Stripe webhook for payment success
      const response = await request(app.getHttpServer())
        .post('/api/v1/webhooks/stripe')
        .send({
          type: 'payment_intent.succeeded',
          data: {
            object: {
              id: `pi_test_${paymentId}`,
              status: 'succeeded',
              amount: 6997,
              metadata: {
                order_id: orderId,
                payment_id: paymentId,
              },
            },
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('Step 8: Verify order is confirmed after payment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/orders/${orderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: orderId,
        payment_status: 'captured',
        line_items: expect.arrayContaining([
          expect.objectContaining({
            status: 'payment_confirmed',
          }),
        ]),
      });
    });

    it('Step 9: Verify inventory was updated', async () => {
      const productResponse = await request(app.getHttpServer())
        .get(`/api/v1/catalog/products/${physicalProduct.id}`)
        .expect(200);

      // Stock should be reduced by 2 (we ordered 2 units)
      expect(productResponse.body.data.stock_quantity).toBe(98);
    });
  });

  describe('Edge Case: Expired Checkout Session', () => {
    it('should not allow order creation from expired session', async () => {
      // Create checkout session
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      const sessionId = sessionResponse.body.data.id;

      // Manually expire the session in database
      await dataSource.query(
        'UPDATE checkout_sessions SET expires_at = NOW() - INTERVAL \'1 hour\', is_expired = true WHERE id = $1',
        [sessionId]
      );

      // Try to create order from expired session
      await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: sessionId,
        })
        .expect(400);
    });
  });

  describe('Edge Case: Out of Stock Product', () => {
    it('should not allow adding out of stock product to cart', async () => {
      // Update product to be out of stock
      await dataSource.query(
        'UPDATE products SET stock_quantity = 0 WHERE id = $1',
        [physicalProduct.id]
      );

      const response = await request(app.getHttpServer())
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          product_id: physicalProduct.id,
          quantity: 1,
        })
        .expect(400);

      expect(response.body.message).toMatch(/out of stock|not available/i);

      // Restore stock
      await dataSource.query(
        'UPDATE products SET stock_quantity = 100 WHERE id = $1',
        [physicalProduct.id]
      );
    });
  });

  describe('Error Case: Payment Failure', () => {
    it('should handle payment failure gracefully', async () => {
      // Create a new checkout and order
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${sessionResponse.body.data.id}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shipping_address: testAddresses.usAddress,
        })
        .expect(200);

      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: sessionResponse.body.data.id,
        })
        .expect(201);

      const newOrderId = orderResponse.body.data.id;

      const paymentResponse = await request(app.getHttpServer())
        .post('/api/v1/payments/authorize')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          order_id: newOrderId,
        })
        .expect(201);

      // Simulate payment failure webhook
      await request(app.getHttpServer())
        .post('/api/v1/webhooks/stripe')
        .send({
          type: 'payment_intent.payment_failed',
          data: {
            object: {
              id: `pi_test_${paymentResponse.body.data.id}`,
              status: 'failed',
              metadata: {
                order_id: newOrderId,
                payment_id: paymentResponse.body.data.id,
              },
            },
          },
        })
        .expect(200);

      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify order status
      const orderCheck = await request(app.getHttpServer())
        .get(`/api/v1/orders/${newOrderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(orderCheck.body.data.payment_status).toBe('failed');
    });
  });

  describe('Cancellation Flow', () => {
    it('should allow user to cancel pending order', async () => {
      // Create order
      const sessionResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${sessionResponse.body.data.id}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shipping_address: testAddresses.usAddress,
        })
        .expect(200);

      const orderResponse = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          checkout_session_id: sessionResponse.body.data.id,
        })
        .expect(201);

      const cancelOrderId = orderResponse.body.data.id;

      // Cancel order
      const cancelResponse = await request(app.getHttpServer())
        .post(`/api/v1/orders/${cancelOrderId}/cancel`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          reason: 'Changed my mind',
        })
        .expect(200);

      expect(cancelResponse.body).toMatchObject({
        success: true,
        message: 'Order cancelled successfully',
        data: expect.objectContaining({
          status: 'cancelled',
        }),
      });

      // Verify inventory was restored
      const productResponse = await request(app.getHttpServer())
        .get(`/api/v1/catalog/products/${physicalProduct.id}`)
        .expect(200);

      expect(productResponse.body.data.stock_quantity).toBeGreaterThan(0);
    });
  });
});
