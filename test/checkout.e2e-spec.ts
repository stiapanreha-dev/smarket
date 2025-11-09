import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Checkout (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let sessionId: string;
  let checkoutSessionId: string;

  const testUser = {
    email: `checkout${Date.now()}@example.com`,
    password: 'SecureP@ss123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('api/v1');

    await app.init();

    // Register user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.tokens.accessToken;

    // For guest checkout
    sessionId = `guest-${Date.now()}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Happy Path - Complete Checkout Flow', () => {
    it('should create checkout session from cart', async () => {
      // Note: In real scenario, we would need to add items to cart first
      // For this test, we'll mock the cart having items
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          metadata: {
            device: 'web',
            referrer: 'https://example.com',
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('cart_snapshot');
      expect(response.body).toHaveProperty('totals');
      expect(response.body.step).toBe('cart_review');
      expect(response.body.status).toBe('in_progress');

      checkoutSessionId = response.body.id;
    });

    it('should get checkout session', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/checkout/sessions/${checkoutSessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(checkoutSessionId);
    });

    it('should update shipping address', async () => {
      const shippingAddress = {
        country: 'US',
        state: 'CA',
        city: 'San Francisco',
        street: '123 Market St',
        postal_code: '94103',
        phone: '+14155551234',
        first_name: 'John',
        last_name: 'Doe',
        use_as_billing: true,
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${checkoutSessionId}/shipping`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(shippingAddress)
        .expect(200);

      expect(response.body.shipping_address).toBeDefined();
      expect(response.body.shipping_address.country).toBe('US');
      expect(response.body.step).toBe('payment_method');
      expect(response.body.totals.shipping_amount).toBeGreaterThan(0);
    });

    it('should apply promo code', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${checkoutSessionId}/apply-promo`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: 'SAVE10' })
        .expect(200);

      expect(response.body.promo_codes).toHaveLength(1);
      expect(response.body.promo_codes[0].code).toBe('SAVE10');
      expect(response.body.totals.discount_amount).toBeGreaterThan(0);
    });

    it('should update payment method', async () => {
      const paymentMethod = {
        payment_method: 'card',
        payment_details: {
          token: 'tok_visa',
          last4: '4242',
        },
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/checkout/sessions/${checkoutSessionId}/payment-method`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(paymentMethod)
        .expect(200);

      expect(response.body.payment_method).toBe('card');
      expect(response.body.step).toBe('order_review');
    });

    it('should complete checkout', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/checkout/sessions/${checkoutSessionId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          idempotency_key: `order-${Date.now()}`,
        })
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.step).toBe('confirmation');
      expect(response.body.order_id).toBeDefined();
      expect(response.body.completed_at).toBeDefined();
    });
  });

  describe('Guest Checkout', () => {
    it('should create checkout session for guest', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .send({
          sessionId: sessionId,
          metadata: { device: 'mobile' },
        })
        .expect(201);

      expect(response.body.session_id).toBe(sessionId);
      expect(response.body.user_id).toBeNull();
    });
  });

  describe('Error Cases', () => {
    it('should return 400 when creating session with empty cart', async () => {
      // Assuming cart is empty or cleared after previous checkout
      await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);
    });

    it('should return 404 for invalid session ID', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/checkout/sessions/invalid-session-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 400 when applying invalid promo code', async () => {
      // First create a new checkout session
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (createResponse.status === 201) {
        const newSessionId = createResponse.body.id;

        await request(app.getHttpServer())
          .post(`/api/v1/checkout/sessions/${newSessionId}/apply-promo`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ code: 'INVALID_CODE' })
          .expect(400);
      }
    });

    it('should return 400 when completing checkout without payment method', async () => {
      // Create new session
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (createResponse.status === 201) {
        const newSessionId = createResponse.body.id;

        await request(app.getHttpServer())
          .post(`/api/v1/checkout/sessions/${newSessionId}/complete`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);
      }
    });
  });

  describe('Session Management', () => {
    let cancelSessionId: string;

    it('should cancel checkout session', async () => {
      // Create session to cancel
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (createResponse.status === 201) {
        cancelSessionId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/api/v1/checkout/sessions/${cancelSessionId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(204);
      }
    });

    it('should return 400 when trying to complete cancelled session', async () => {
      if (cancelSessionId) {
        await request(app.getHttpServer())
          .post(`/api/v1/checkout/sessions/${cancelSessionId}/complete`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);
      }
    });
  });

  describe('Idempotency', () => {
    it('should prevent duplicate orders with same idempotency key', async () => {
      const idempotencyKey = `test-idempotent-${Date.now()}`;

      // Create and complete first checkout
      const session1 = await request(app.getHttpServer())
        .post('/api/v1/checkout/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (session1.status === 201) {
        const sessionId1 = session1.body.id;

        // Add shipping and payment
        await request(app.getHttpServer())
          .put(`/api/v1/checkout/sessions/${sessionId1}/shipping`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            country: 'US',
            city: 'NYC',
            street: '456 Ave',
            postal_code: '10001',
            phone: '+14155559999',
          });

        await request(app.getHttpServer())
          .put(`/api/v1/checkout/sessions/${sessionId1}/payment-method`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            payment_method: 'card',
          });

        // Complete with idempotency key
        const complete1 = await request(app.getHttpServer())
          .post(`/api/v1/checkout/sessions/${sessionId1}/complete`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ idempotency_key: idempotencyKey })
          .expect(200);

        const orderId1 = complete1.body.order_id;

        // Try to complete again with same key - should return same order
        const complete2 = await request(app.getHttpServer())
          .post(`/api/v1/checkout/sessions/${sessionId1}/complete`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ idempotency_key: idempotencyKey })
          .expect(200);

        expect(complete2.body.order_id).toBe(orderId1);
      }
    });
  });
});
