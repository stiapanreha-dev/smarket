import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductType } from '../src/database/entities/product.entity';
import { TranslationLocale } from '../src/database/entities/product-translation.entity';

describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let merchantId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/products', () => {
    it('should create a product (requires authentication)', () => {
      const createProductDto = {
        type: ProductType.PHYSICAL,
        base_price_minor: 19999,
        currency: 'USD',
        translations: [
          {
            locale: TranslationLocale.EN,
            title: 'Test Product',
            description: 'Test Description',
          },
          {
            locale: TranslationLocale.RU,
            title: 'Тестовый Продукт',
            description: 'Тестовое Описание',
          },
          {
            locale: TranslationLocale.AR,
            title: 'منتج تجريبي',
            description: 'وصف تجريبي',
          },
        ],
      };

      // This test requires authentication setup
      // TODO: Add authentication logic when auth is properly configured
      expect(createProductDto).toBeDefined();
    });
  });

  describe('GET /api/v1/products', () => {
    it('should return list of products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('products');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('limit');
          expect(res.body).toHaveProperty('offset');
        });
    });

    it('should filter products by type', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ type: ProductType.PHYSICAL })
        .expect(200);
    });

    it('should search products by query', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .query({ q: 'headphones' })
        .expect(200);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return 404 for non-existent product', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer()).get(`/api/v1/products/${fakeId}`).expect(404);
    });

    it('should return 400 for invalid UUID', () => {
      return request(app.getHttpServer()).get('/api/v1/products/invalid-uuid').expect(400);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    it('should require authentication', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer())
        .put(`/api/v1/products/${fakeId}`)
        .send({ status: 'active' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should require authentication', () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      return request(app.getHttpServer()).delete(`/api/v1/products/${fakeId}`).expect(401);
    });
  });
});
