import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DataSource } from 'typeorm';
import { getTestDataSource } from './setup';
import { resetTestDatabase } from './utils/test-db';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testUser: { email: string; password: string };

  const buildTestUser = () => ({
    email: `test_${Date.now()}_${Math.random().toString(16).slice(2)}@example.com`,
    password: 'SecureP@ss123',
  });

  const registerUser = async (user: { email: string; password: string }) => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(user)
      .expect(201);
  };

  beforeAll(async () => {
    dataSource = getTestDataSource();

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
  });

  beforeEach(async () => {
    await resetTestDatabase(dataSource);
    testUser = buildTestUser();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const res = await registerUser(testUser);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('should return 409 when registering with existing email', async () => {
      await registerUser(testUser);

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);
    });

    it('should return 400 when password is weak', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'weak@example.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      await registerUser(testUser);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(testUser)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.tokens).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid credentials', async () => {
      await registerUser(testUser);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('/api/v1/auth/me (GET)', () => {
    it('should return current user profile', async () => {
      const registerResponse = await registerUser(testUser);
      const { accessToken } = registerResponse.body.tokens;

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/v1/auth/refresh (POST)', () => {
    it('should refresh access token', async () => {
      const registerResponse = await registerUser(testUser);
      const { refreshToken } = registerResponse.body.tokens;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should return 401 with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/api/v1/auth/logout (POST)', () => {
    it('should logout user', async () => {
      const registerResponse = await registerUser(testUser);
      const { accessToken, refreshToken } = registerResponse.body.tokens;

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('message');
    });
  });
});
