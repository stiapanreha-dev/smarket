# Промпты для реализации SnailMarketplace MVP

**Версия:** 1.0
**Дата:** 2025-11-08
**Назначение:** Готовые промпты для AI-ассистентов для пошаговой реализации

---

## 📋 Как использовать эти промпты

1. Копируйте промпт в Claude/ChatGPT/Cursor
2. Контекст: приложите соответствующие файлы документации
3. Итерируйте: уточняйте детали по мере реализации
4. Code review: всегда проверяйте сгенерированный код

---

## 🚀 Sprint 0: Project Setup

### Промпт 0.1: Инициализация проекта

```
Создай NestJS проект для маркетплейса SnailMarketplace со следующими требованиями:

КОНТЕКСТ:
- Модульный монолит с четкими границами модулей
- TypeScript с строгой типизацией
- PostgreSQL + Redis + S3 storage
- Поддержка мультиязычности (EN/RU/AR)

ЗАДАЧИ:
1. Инициализировать NestJS проект с следующей структурой:
   src/
   ├── modules/
   │   ├── auth/
   │   ├── user/
   │   ├── catalog/
   │   ├── inventory/
   │   ├── booking/
   │   ├── order/
   │   ├── payment/
   │   └── notification/
   ├── common/
   │   ├── decorators/
   │   ├── filters/
   │   ├── guards/
   │   ├── interceptors/
   │   └── pipes/
   ├── config/
   └── database/

2. Настроить TypeScript с строгими правилами:
   - strictNullChecks: true
   - noImplicitAny: true
   - Path aliases для модулей

3. Установить зависимости:
   - @nestjs/typeorm, pg
   - @nestjs/config
   - @nestjs/jwt, @nestjs/passport
   - ioredis
   - @aws-sdk/client-s3
   - class-validator, class-transformer
   - i18next

4. Создать docker-compose.yml с:
   - PostgreSQL 15
   - Redis 7
   - LocalStack (S3/SQS emulation)
   - Adminer (DB UI)

5. Настроить ESLint + Prettier + Husky для pre-commit hooks

РЕЗУЛЬТАТ:
- README.md с инструкциями по запуску
- Все сервисы поднимаются через docker-compose up
- npm run start:dev работает
- Health check endpoint /health
```

### Промпт 0.2: Database Schema Foundation

```
Создай базовую схему PostgreSQL для маркетплейса со следующими требованиями:

КОНТЕКСТ:
Из docs/SnailMarketplace_MVP_Architecture.md используй секцию "5. Domain Model"

ЗАДАЧИ:
1. Создай TypeORM migrations для:
   - users (с поддержкой locale, currency)
   - merchants (с kyc_status, payout_method)
   - products (type: PHYSICAL|SERVICE|COURSE)
   - product_variants (с JSONB attrs)
   - product_translations (мультиязычность)

2. Добавь необходимые индексы:
   - GIN индекс на product_translations для full-text search
   - B-tree индексы на foreign keys
   - Composite индексы на часто используемые фильтры

3. Включи расширения PostgreSQL:
   - uuid-ossp (генерация UUID)
   - pg_trgm (trigram search)
   - btree_gin (GIN индексы)

4. Создай seed data:
   - 2 тестовых merchant
   - 20 продуктов (mix: physical/digital/service)
   - Переводы на EN/RU/AR

5. Настрой TypeORM entities с:
   - Proper relations
   - Validation decorators
   - Virtual fields для локализации

КРИТЕРИИ УСПЕХА:
- npm run migration:run работает без ошибок
- npm run seed создает тестовые данные
- Все таблицы имеют created_at/updated_at
- Row-Level Security (RLS) для merchant-owned данных
```

### Промпт 0.3: CI/CD Pipeline

```
Настрой CI/CD pipeline для NestJS проекта на GitHub Actions:

ТРЕБОВАНИЯ:
1. На каждый push в feature/* ветки:
   - Lint (ESLint)
   - Type check (tsc --noEmit)
   - Unit tests (Jest)
   - Build Docker image

2. На PR в develop:
   - Все проверки выше
   - Integration tests
   - Security scan (npm audit)
   - Code coverage report (>80%)

3. На merge в develop:
   - Deploy to staging environment
   - Run E2E tests
   - Performance tests (basic)

4. На merge в main:
   - Deploy to production
   - Blue-green deployment
   - Automatic rollback on errors

5. Настрой environments:
   - Staging: auto-deploy
   - Production: требует manual approval

ИНСТРУМЕНТЫ:
- GitHub Actions
- Docker Hub для образов
- Secrets для credentials

РЕЗУЛЬТАТ:
- .github/workflows/ci.yml
- .github/workflows/deploy-staging.yml
- .github/workflows/deploy-production.yml
- Документация в README.md
```

---

## 🔐 Sprint 1: Authentication & Users

### Промпт 1.1: JWT Authentication

```
Реализуй систему аутентификации с JWT для маркетплейса:

КОНТЕКСТ:
Из docs/sprint-1-auth-users.md используй секции AUTH-001, AUTH-002

ТРЕБОВАНИЯ:
1. Регистрация пользователя:
   - Email + password (Argon2id hashing)
   - Password strength validation (min 8 chars, uppercase, lowercase, digit, special)
   - Email verification token (24h expiry)
   - Locale/currency auto-detection
   - Welcome email

2. Login flow:
   - JWT access token (15 min lifetime)
   - Refresh token (30 days, rotating)
   - Device tracking (user_agent, IP)
   - Rate limiting (5 attempts per 15 min)

3. Token management:
   - Refresh token rotation (detect reuse)
   - Blacklist for revoked tokens (Redis)
   - Session management (multi-device support)

4. Защита endpoints:
   - JwtAuthGuard для protected routes
   - RolesGuard для RBAC (buyer/merchant/admin)
   - Decorator @CurrentUser() для получения user из токена

5. Security features:
   - CORS configuration
   - Helmet.js headers
   - Rate limiting (Express Rate Limit)

ТЕХНОЛОГИИ:
- @nestjs/jwt
- @nestjs/passport
- passport-jwt
- argon2
- express-rate-limit

ТЕСТЫ:
- Unit: AuthService методы
- Integration: Registration/Login endpoints
- E2E: Полный user journey

РЕЗУЛЬТАТ:
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Промпт 1.2: User Profile Management

```
Реализуй управление профилями пользователей:

ФУНКЦИОНАЛ:
1. Получение профиля:
   - GET /api/v1/users/me
   - Включить merchant info если user is merchant
   - Локализованные поля

2. Обновление профиля:
   - PUT /api/v1/users/me
   - Валидация: email unique, phone format
   - Audit log для критичных изменений

3. Смена пароля:
   - POST /api/v1/users/me/change-password
   - Требовать current password
   - Invalidate все refresh tokens

4. Email верификация:
   - POST /api/v1/users/verify-email
   - Resend verification: POST /api/v1/users/resend-verification

5. Password reset:
   - POST /api/v1/users/forgot-password (send reset link)
   - POST /api/v1/users/reset-password (with token)
   - 1 hour token expiry

БЕЗОПАСНОСТЬ:
- Rate limiting на forgot-password (3 requests per hour)
- Email enumeration protection
- Secure password reset tokens

DTO VALIDATION:
- class-validator для всех DTOs
- Custom validators для phone formats по locale
- Sanitization для text inputs

РЕЗУЛЬТАТ:
- Полный CRUD для user profile
- Email templates для notifications
- Swagger документация
```

---

## 📦 Sprint 2: Product Catalog

### Промпт 2.1: Product Management

```
Реализуй систему управления каталогом товаров:

КОНТЕКСТ:
Из docs/sprint-2-catalog.md, секция CAT-001

СУЩНОСТИ:
1. Product (базовая информация):
   - type: PHYSICAL | DIGITAL | SERVICE
   - status: DRAFT | ACTIVE | INACTIVE | DELETED
   - merchant_id (owner)
   - base_price, currency

2. ProductVariant (варианты товара):
   - SKU уникален в рамках merchant
   - price, compare_at_price, cost
   - attributes JSONB: {color, size, etc}
   - inventory_quantity

3. ProductTranslation (мультиязычность):
   - name, slug, description
   - meta_title, meta_description (SEO)
   - locale: en | ru | ar

4. ProductImage:
   - S3 URL
   - alt_text локализован
   - position (ordering)

CRUD ОПЕРАЦИИ:
1. CREATE product:
   - Merchant может создавать только свои продукты
   - Обязательно: translations для всех 3 языков
   - Auto-generate slug из name
   - Validate: price > 0, SKU unique

2. UPDATE product:
   - Версионирование для price changes
   - Audit log для критичных изменений
   - Emit ProductUpdated event (Outbox)

3. DELETE product:
   - Soft delete (status = DELETED)
   - Проверка: нет активных заказов
   - Cascade: варианты, images

4. BULK operations:
   - Import CSV (merchants)
   - Bulk price update
   - Bulk status change

ПОИСК:
- PostgreSQL full-text search (pg_trgm)
- GIN индекс на translations.name, description
- Filters: type, status, price_range, merchant_id
- Sorting: price, created_at, popularity

ИЗОБРАЖЕНИЯ:
- Upload на S3 через presigned URLs
- Resize: thumbnail (100x100), medium (500x500), large (1200x1200)
- Поддержка: JPG, PNG, WebP
- Max size: 5MB

API ENDPOINTS:
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products (list + search + filters)
POST   /api/v1/products/:id/images
POST   /api/v1/products/bulk-import

РЕЗУЛЬТАТ:
- RBAC: только merchant может управлять своими products
- Swagger документация
- Unit + Integration тесты
```

### Промпт 2.2: Search & Filtering

```
Реализуй поиск и фильтрацию в каталоге:

ТРЕБОВАНИЯ:
1. Full-text search:
   - PostgreSQL pg_trgm для нечеткого поиска
   - Поддержка всех 3 языков (en/ru/ar)
   - Поиск по: name, description, SKU
   - Highlight найденных терминов

2. Фильтры:
   - type: [physical, digital, service]
   - price_range: {min, max}
   - merchant_id
   - status: [active]
   - attributes: dynamic по JSONB (color, size, etc)
   - availability: in_stock | out_of_stock

3. Сортировка:
   - relevance (default)
   - price_asc | price_desc
   - created_at_desc
   - popularity (по количеству заказов)

4. Pagination:
   - Cursor-based для больших датасетов
   - Limit: max 100 items per page
   - Include total count

5. Faceted search:
   - Агрегация по: type, price_ranges, merchants
   - Count товаров в каждом фасете

ОПТИМИЗАЦИЯ:
- GIN индексы на translation fields
- Composite индекс на (type, status, merchant_id)
- Query plan analysis (EXPLAIN ANALYZE)
- Redis cache для популярных запросов (TTL 5 min)

API:
GET /api/v1/products/search?q=laptop&type=physical&price_min=500&price_max=2000&sort=price_asc&page=1&limit=20

RESPONSE:
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 150 },
  "facets": {
    "types": {"physical": 100, "digital": 50},
    "price_ranges": {"0-500": 30, "500-1000": 70, "1000+": 50}
  }
}

ПРОИЗВОДИТЕЛЬНОСТЬ:
- Target: p95 < 200ms для search queries
- Cache hit rate: > 60% для популярных запросов
```

---

## 🛒 Sprint 3: Cart & Checkout

### Промпт 3.1: Shopping Cart

```
Реализуй корзину покупок с Redis:

КОНТЕКСТ:
Из docs/sprint-3-cart-checkout.md, секция CART-001

АРХИТЕКТУРА:
- Хранение в Redis (быстрый доступ)
- TTL для guest carts: 7 дней
- Persist для logged-in users: без TTL
- Merge guest → user cart при login

МОДЕЛЬ ДАННЫХ:
interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;  // для guest
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;  // snapshot на момент добавления
  currency: string;
  merchantId: string;
  type: 'physical' | 'digital' | 'service';
  metadata?: {
    bookingDate?: Date;
    bookingSlot?: string;
  };
}

ОПЕРАЦИИ:
1. Add to cart:
   - Validate: product exists, is active
   - Check inventory (для physical)
   - Check slot availability (для service)
   - Merge if item уже в корзине
   - Emit CartUpdated event

2. Update quantity:
   - Validate inventory
   - Update price if changed
   - Remove if quantity = 0

3. Remove item:
   - Release inventory reservation if any

4. Get cart:
   - Validate prices (могли измениться)
   - Mark unavailable items
   - Calculate totals

5. Clear cart:
   - После успешного checkout
   - Manual clear by user

ВАЛИДАЦИЯ:
- Max 50 items в корзине
- Max quantity per item: 99
- Price changes: показать warning user
- Out of stock: показать unavailable

REDIS СТРУКТУРА:
Key: cart:{userId} или cart:session:{sessionId}
Value: JSON.stringify(Cart)
TTL: 7 days для guest, none для user

API:
POST   /api/v1/cart/items
GET    /api/v1/cart
PUT    /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id
DELETE /api/v1/cart

EDGE CASES:
- Concurrent updates (Redis WATCH/MULTI)
- Guest → User merge
- Price changes во время checkout
- Expired booking slots
```

### Промпт 3.2: Checkout Flow

```
Реализуй многошаговый процесс checkout:

ЭТАПЫ:
1. Cart review
2. Shipping address (для physical)
3. Payment method
4. Order review
5. Payment
6. Confirmation

МОДЕЛЬ:
CREATE TABLE checkout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  cart_snapshot JSONB NOT NULL,
  step VARCHAR(50) DEFAULT 'cart_review',
  shipping_address JSONB,
  billing_address JSONB,
  payment_method VARCHAR(50),
  totals JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'in_progress',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

РАСЧЕТ TOTALS:
{
  subtotal: number;        // сумма items
  tax_amount: number;      // VAT/налоги
  shipping_amount: number; // доставка
  discount_amount: number; // промокоды
  total_amount: number;    // итого
  currency: string;
}

БИЗНЕС-ЛОГИКА:
1. Create session:
   - Snapshot cart items (цены могут измениться)
   - Reserve inventory (TTL 15 min)
   - Reserve booking slots (TTL 15 min)
   - Calculate taxes по address
   - TTL session: 30 minutes

2. Update shipping:
   - Validate address format
   - Calculate shipping cost
   - Update totals

3. Apply promo code:
   - Validate: active, not expired, usage limits
   - Calculate discount
   - Update totals

4. Select payment method:
   - card, apple_pay, bank_transfer, etc
   - Region-specific methods

5. Complete checkout:
   - Create Order
   - Create Payment (authorize)
   - Clear cart
   - Send confirmation email
   - Release session

CONCURRENCY:
- Idempotency key для create order
- Pessimistic locks для inventory
- Atomic slot reservations

EDGE CASES:
- Session expiry: release reservations
- Payment timeout: retry or cancel
- Partial failures: Saga pattern для rollback

API:
POST   /api/v1/checkout/sessions
GET    /api/v1/checkout/sessions/:id
PUT    /api/v1/checkout/sessions/:id/shipping
PUT    /api/v1/checkout/sessions/:id/payment-method
POST   /api/v1/checkout/sessions/:id/apply-promo
POST   /api/v1/checkout/sessions/:id/complete

ПРОИЗВОДИТЕЛЬНОСТЬ:
- Cache tax rates by region
- Batch inventory checks
- Async: email sending, analytics

ТЕСТЫ:
- Happy path
- Expired session
- Insufficient inventory
- Payment failure + rollback
```

---

## 📋 Sprint 4: Orders Management

### Промпт 4.1: Order Creation & FSM

```
Реализуй систему заказов с FSM для каждого типа line item:

КОНТЕКСТ:
Из docs/sprint-4-orders.md, используй секцию ORD-001

МОДЕЛЬ ДАННЫХ:
- orders table (header level)
- order_line_items table (line level с FSM)
- order_status_transitions table (audit trail)

FSM ДЛЯ PHYSICAL ITEMS:
States: PENDING → PAYMENT_CONFIRMED → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED
Cancellable до: READY_TO_SHIP
Refundable до: DELIVERED + 14 days

FSM ДЛЯ DIGITAL ITEMS:
States: PENDING → PAYMENT_CONFIRMED → ACCESS_GRANTED → CONSUMED
Refundable: до ACCESS_GRANTED (instant) или 7 days после

FSM ДЛЯ SERVICE ITEMS:
States: PENDING → BOOKING_CONFIRMED → PAYMENT_CONFIRMED → COMPLETED | NO_SHOW
Cancellable: 24h перед appointment
Refundable: policy-based

СОЗДАНИЕ ЗАКАЗА:
async function createOrder(checkoutSessionId: string): Promise<Order> {
  return db.transaction(async (trx) => {
    // 1. Validate session не expired
    const session = await getCheckoutSession(checkoutSessionId);

    // 2. Confirm inventory reservations
    await inventoryService.confirmReservations(session.reservations, trx);

    // 3. Confirm booking slots
    await bookingService.confirmSlots(session.bookings, trx);

    // 4. Create order + line items
    const order = await createOrderRecord(session, trx);

    // 5. Emit OrderCreated event (Outbox pattern)
    await outbox.emit('OrderCreated', order, trx);

    // 6. Return order
    return order;
  });
}

ПЕРЕХОДЫ СОСТОЯНИЙ:
class OrderFSMService {
  async transition(
    lineItemId: string,
    toStatus: string,
    metadata?: any
  ): Promise<void> {
    return db.transaction(async (trx) => {
      // 1. Load line item с блокировкой
      const item = await trx
        .select('*')
        .from('order_line_items')
        .where('id', lineItemId)
        .forUpdate()
        .first();

      // 2. Validate transition allowed
      const allowed = this.validateTransition(item.type, item.status, toStatus);
      if (!allowed) throw new InvalidTransitionError();

      // 3. Execute side effects
      await this.executeSideEffects(item, toStatus, trx);

      // 4. Update status
      await trx('order_line_items')
        .where('id', lineItemId)
        .update({
          status: toStatus,
          last_status_change: new Date()
        });

      // 5. Log transition
      await this.logTransition(item, toStatus, metadata, trx);

      // 6. Emit event
      await outbox.emit('LineItemStatusChanged', {
        lineItemId,
        fromStatus: item.status,
        toStatus
      }, trx);
    });
  }
}

API ENDPOINTS:
POST   /api/v1/orders (create from checkout)
GET    /api/v1/orders/:id
GET    /api/v1/orders (list с фильтрами)
POST   /api/v1/orders/:id/line-items/:itemId/transition
POST   /api/v1/orders/:id/cancel
POST   /api/v1/orders/:id/refund

MERCHANT API:
GET    /api/v1/merchant/orders (только свои orders)
POST   /api/v1/merchant/orders/:id/line-items/:itemId/fulfill
POST   /api/v1/merchant/orders/:id/line-items/:itemId/ship

WEBHOOKS:
- Order created → notify merchant
- Status changed → notify customer
- Delivery → rating request

РЕЗУЛЬТАТ:
- Полная FSM реализация для всех типов
- Audit trail для всех переходов
- Unit тесты для каждого перехода
- Integration тесты для Saga scenarios
```

### Промпт 4.2: Outbox Pattern

```
Реализуй Outbox pattern для надежной доставки событий:

КОНТЕКСТ:
События должны доставляться exactly-once даже при сбоях

АРХИТЕКТУРА:
1. Outbox table в той же БД что и основные данные
2. Background worker читает outbox и отправляет события
3. Retry с exponential backoff
4. Dead letter queue для failed events

ТАБЛИЦА:
CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  error TEXT,

  INDEX idx_outbox_pending (status, created_at) WHERE status = 'pending'
);

ИСПОЛЬЗОВАНИЕ:
// При создании заказа
await db.transaction(async (trx) => {
  // Основная операция
  const order = await trx.insert('orders').values(orderData);

  // Добавляем событие в outbox
  await trx.insert('outbox').values({
    aggregate_id: order.id,
    aggregate_type: 'Order',
    event_type: 'OrderCreated',
    payload: JSON.stringify(order)
  });
});

WORKER:
@Injectable()
export class OutboxProcessor {
  @Cron('*/10 * * * * *')  // каждые 10 секунд
  async processEvents() {
    const events = await this.db
      .select('*')
      .from('outbox')
      .where('status', 'pending')
      .where('retry_count', '<', 5)
      .orderBy('created_at')
      .limit(100)
      .forUpdate()
      .skipLocked();

    for (const event of events) {
      try {
        // Dispatch to handlers
        await this.dispatcher.dispatch(event);

        // Mark as processed
        await this.db('outbox')
          .where('id', event.id)
          .update({
            status: 'processed',
            processed_at: new Date()
          });
      } catch (error) {
        // Increment retry
        await this.db('outbox')
          .where('id', event.id)
          .update({
            retry_count: event.retry_count + 1,
            error: error.message
          });

        // Move to DLQ after 5 attempts
        if (event.retry_count >= 4) {
          await this.moveToDLQ(event);
        }
      }
    }
  }
}

EVENT HANDLERS:
@Injectable()
export class OrderCreatedHandler {
  @OnEvent('OrderCreated')
  async handle(event: OrderCreatedEvent) {
    // Send email
    await this.emailService.sendOrderConfirmation(event.order);

    // Update search index
    await this.searchService.indexOrder(event.order);

    // Send analytics
    await this.analyticsService.trackOrderCreated(event.order);
  }
}

МОНИТОРИНГ:
- Outbox lag (время между created_at и processed_at)
- Retry rate
- DLQ size
- Processing throughput

РЕЗУЛЬТАТ:
- Exactly-once delivery гарантия
- Автоматические ретраи
- Observability через metrics
```

---

## 💳 Sprint 5: Payments Integration

### Промпт 5.1: Payment Service

```
Реализуй платежный сервис с поддержкой split-payments:

КОНТЕКСТ:
Из docs/sprint-5-payments.md

ПРОВАЙДЕРЫ:
1. Stripe (международные карты, ОАЭ)
2. YooKassa (Россия, фискализация)
3. Network International (ОАЭ local)

АБСТРАКЦИЯ:
interface PaymentProvider {
  createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntent>;
  capturePayment(intentId: string, amount?: number): Promise<PaymentResult>;
  refundPayment(intentId: string, amount: number): Promise<RefundResult>;
  getPaymentStatus(intentId: string): Promise<PaymentStatus>;
}

МОДЕЛЬ ДАННЫХ:
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_payment_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,

  -- Authorize vs Capture
  authorized_amount INTEGER,
  captured_amount INTEGER DEFAULT 0,
  refunded_amount INTEGER DEFAULT 0,

  -- Split payments
  platform_fee INTEGER NOT NULL,

  -- Idempotency
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_splits (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments(id),
  merchant_id UUID REFERENCES merchants(id),
  amount_minor INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  net_amount INTEGER NOT NULL,  -- amount - fee
  status VARCHAR(20) DEFAULT 'pending',
  payout_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

ПРОЦЕСС AUTHORIZE:
async function authorizePayment(orderId: string): Promise<Payment> {
  const order = await getOrder(orderId);
  const idempotencyKey = generateIdempotencyKey(orderId);

  // Check existing payment
  const existing = await findPaymentByIdempotency(idempotencyKey);
  if (existing) return existing;

  return db.transaction(async (trx) => {
    // Calculate splits
    const splits = calculateSplits(order.lineItems);

    // Create payment record
    const payment = await trx.insert('payments').values({
      order_id: orderId,
      amount_minor: order.total_amount,
      currency: order.currency,
      idempotency_key: idempotencyKey,
      status: 'pending'
    });

    // Create splits
    await trx.insert('payment_splits').values(splits);

    // Call provider
    const provider = getProvider(order.payment_method);
    const intent = await provider.createPaymentIntent({
      amount: order.total_amount,
      currency: order.currency,
      orderId: orderId,
      merchantIds: splits.map(s => s.merchant_id)
    });

    // Update payment with provider ID
    await trx('payments')
      .where('id', payment.id)
      .update({
        provider_payment_id: intent.id,
        status: 'authorized'
      });

    return payment;
  });
}

ПРОЦЕСС CAPTURE:
- Physical items: при переходе в PREPARING
- Digital items: сразу после подтверждения
- Service items: после завершения услуги

SPLIT CALCULATION:
function calculateSplits(lineItems: LineItem[]): Split[] {
  const merchantGroups = groupBy(lineItems, 'merchantId');

  return merchantGroups.map(([merchantId, items]) => {
    const subtotal = sum(items.map(i => i.price * i.quantity));
    const platformFee = calculateFee(items[0].type, subtotal);

    return {
      merchant_id: merchantId,
      amount_minor: subtotal,
      platform_fee: platformFee,
      net_amount: subtotal - platformFee
    };
  });
}

function calculateFee(type: string, amount: number): number {
  const rates = {
    physical: 0.15,  // 15%
    digital: 0.20,   // 20%
    service: 0.10    // 10%
  };
  return Math.round(amount * rates[type]);
}

WEBHOOKS:
POST /api/v1/webhooks/stripe
POST /api/v1/webhooks/yookassa

async function handleWebhook(provider: string, payload: any, signature: string) {
  // 1. Verify signature
  verifyWebhookSignature(provider, payload, signature);

  // 2. Parse event
  const event = parseWebhookEvent(provider, payload);

  // 3. Idempotency check
  if (await isEventProcessed(event.id)) return;

  // 4. Process event
  await processPaymentEvent(event);

  // 5. Mark processed
  await markEventProcessed(event.id);
}

API:
POST   /api/v1/payments/authorize
POST   /api/v1/payments/:id/capture
POST   /api/v1/payments/:id/refund
GET    /api/v1/payments/:id/status

РЕЗУЛЬТАТ:
- Поддержка 3 провайдеров
- Split payments logic
- Idempotency на всех операциях
- Webhook handling с signature verification
- Retry механизм для failed captures
```

### Промпт 5.2: Escrow & Payouts

```
Реализуй систему выплат продавцам:

БИЗНЕС-ЛОГИКА:
- Средства удерживаются 7 дней (escrow period)
- Payouts каждую неделю (по пятницам)
- Минимальная сумма для вывода: 100 единиц валюты

МОДЕЛЬ:
CREATE TABLE payouts (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  amount_minor INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',

  -- Payment details
  method VARCHAR(50),  -- bank_transfer, stripe_connect, etc
  account_details JSONB,

  -- Processing
  batch_id UUID,
  processed_at TIMESTAMP,
  arrived_at TIMESTAMP,

  -- Reconciliation
  splits_included INTEGER[],  -- IDs of payment_splits

  created_at TIMESTAMP DEFAULT NOW()
);

РАСЧЕТ PAYOUT:
async function calculatePayout(merchantId: string): Promise<number> {
  // Получить все splits ready для выплаты
  const splits = await db('payment_splits')
    .where('merchant_id', merchantId)
    .where('status', 'captured')
    .where('payout_id', null)
    .whereRaw('created_at < NOW() - INTERVAL \'7 days\'');  // escrow period

  return sum(splits.map(s => s.net_amount));
}

СОЗДАНИЕ PAYOUT:
@Cron('0 10 * * 5')  // Каждую пятницу в 10:00
async function createWeeklyPayouts() {
  const merchants = await getActiveMerchants();

  for (const merchant of merchants) {
    const amount = await calculatePayout(merchant.id);

    if (amount < getMinimumPayout(merchant.currency)) {
      continue;  // Skip if below minimum
    }

    await db.transaction(async (trx) => {
      // Create payout
      const payout = await trx.insert('payouts').values({
        merchant_id: merchant.id,
        amount_minor: amount,
        currency: merchant.currency,
        method: merchant.payout_method,
        account_details: merchant.payout_account
      });

      // Link splits to payout
      await trx('payment_splits')
        .where('merchant_id', merchant.id)
        .where('status', 'captured')
        .where('payout_id', null)
        .update({ payout_id: payout.id });

      // Emit event
      await outbox.emit('PayoutCreated', payout, trx);
    });
  }
}

ОБРАБОТКА PAYOUT:
async function processPayout(payoutId: string) {
  const payout = await getPayout(payoutId);

  try {
    // Call provider (Stripe Connect, bank transfer, etc)
    const result = await payoutProvider.transfer({
      amount: payout.amount_minor,
      currency: payout.currency,
      destination: payout.account_details
    });

    // Update status
    await db('payouts')
      .where('id', payoutId)
      .update({
        status: 'processing',
        processed_at: new Date()
      });

    // Notify merchant
    await notificationService.send({
      type: 'payout_initiated',
      merchantId: payout.merchant_id,
      amount: payout.amount_minor
    });
  } catch (error) {
    await db('payouts')
      .where('id', payoutId)
      .update({ status: 'failed', error: error.message });
  }
}

MERCHANT DASHBOARD:
GET /api/v1/merchant/payouts
GET /api/v1/merchant/balance
GET /api/v1/merchant/transactions

ADMIN:
GET /api/v1/admin/payouts (все выплаты)
POST /api/v1/admin/payouts/:id/approve
POST /api/v1/admin/payouts/:id/reject

RECONCILIATION:
- Daily job сверяет payment_splits с payouts
- Отчет по несоответствиям
- Audit trail для всех изменений

РЕЗУЛЬТАТ:
- Автоматические недельные выплаты
- Merchant dashboard с балансом
- Reconciliation отчеты
```

---

## 📅 Sprint 6: Bookings (Требуется доработка)

### Промпт 6.1: Booking System

```
Реализуй систему бронирования услуг:

КОНТЕКСТ:
Салоны красоты, барбершопы, мастера предоставляют услуги по расписанию

СУЩНОСТИ:
1. Service (услуга):
   - Продолжительность (30, 60, 90 минут)
   - Цена
   - Категория (haircut, massage, manicure, etc)
   - Provider (merchant/мастер)

2. Schedule (расписание):
   - Weekly recurring slots
   - Exceptions (выходные, отпуск)
   - Business hours
   - Timezone

3. Booking (бронирование):
   - Service + slot
   - Customer
   - Status: PENDING → CONFIRMED → COMPLETED | NO_SHOW | CANCELLED
   - Payment

МОДЕЛЬ:
CREATE TABLE services (
  id UUID PRIMARY KEY,
  merchant_id UUID REFERENCES merchants(id),
  provider_id UUID,  -- specific мастер (optional)
  name VARCHAR(255) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price_minor INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL,
  buffer_minutes INTEGER DEFAULT 0,  -- время на подготовку между сессиями
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE schedules (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  provider_id UUID,
  timezone VARCHAR(50) NOT NULL,

  -- Weekly schedule (JSONB)
  weekly_slots JSONB NOT NULL,
  /* Example:
  {
    "monday": [{"start": "09:00", "end": "18:00"}],
    "tuesday": [{"start": "09:00", "end": "18:00"}],
    "wednesday": [],  // day off
    ...
  }
  */

  -- Exceptions
  exceptions JSONB DEFAULT '[]',
  /* Example:
  [
    {"date": "2024-12-31", "type": "holiday"},
    {"date": "2024-07-15", "slots": [{"start": "10:00", "end": "14:00"}]}
  ]
  */

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY,
  service_id UUID REFERENCES services(id),
  order_line_item_id UUID REFERENCES order_line_items(id),
  customer_id UUID REFERENCES users(id),
  provider_id UUID,

  -- Time slot
  start_at TIMESTAMP NOT NULL,
  end_at TIMESTAMP NOT NULL,
  timezone VARCHAR(50) NOT NULL,

  status VARCHAR(50) NOT NULL,

  -- Reminders
  reminder_sent_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent double booking
  UNIQUE(service_id, provider_id, start_at),
  INDEX idx_bookings_time (start_at, end_at),
  INDEX idx_bookings_provider (provider_id, start_at)
);

ГЕНЕРАЦИЯ AVAILABLE SLOTS:
async function getAvailableSlots(
  serviceId: string,
  date: Date
): Promise<TimeSlot[]> {
  const service = await getService(serviceId);
  const schedule = await getSchedule(serviceId);

  // 1. Get weekly slots for this day
  const dayOfWeek = format(date, 'dddd').toLowerCase();
  const daySlots = schedule.weekly_slots[dayOfWeek] || [];

  // 2. Check exceptions
  const exception = schedule.exceptions.find(e =>
    isSameDay(parseISO(e.date), date)
  );
  if (exception?.type === 'holiday') return [];
  if (exception?.slots) daySlots = exception.slots;

  // 3. Generate time slots
  const slots = [];
  for (const period of daySlots) {
    let current = parseTime(period.start);
    const end = parseTime(period.end);

    while (current < end) {
      const slotEnd = addMinutes(current, service.duration_minutes);
      if (slotEnd <= end) {
        slots.push({
          start: current,
          end: slotEnd
        });
      }
      current = addMinutes(slotEnd, service.buffer_minutes);
    }
  }

  // 4. Filter already booked slots
  const booked = await getBookedSlots(serviceId, date);
  const available = slots.filter(slot =>
    !booked.some(b => slotsOverlap(slot, b))
  );

  return available;
}

БРОНИРОВАНИЕ С КОНКУРЕНТНОСТЬЮ:
async function createBooking(params: BookingParams): Promise<Booking> {
  return db.transaction(async (trx) => {
    // 1. Lock slot atomically (Redis)
    const lockKey = `booking:${params.serviceId}:${params.providerId}:${params.startAt}`;
    const locked = await redis.set(lockKey, 'locked', 'NX', 'EX', 900);  // 15 min TTL

    if (!locked) {
      throw new SlotNotAvailableError('Slot is being booked by another user');
    }

    try {
      // 2. Double-check availability in DB
      const existing = await trx
        .select('*')
        .from('bookings')
        .where('service_id', params.serviceId)
        .where('provider_id', params.providerId)
        .where('start_at', params.startAt)
        .first();

      if (existing) {
        throw new SlotNotAvailableError('Slot already booked');
      }

      // 3. Create booking
      const booking = await trx.insert('bookings').values({
        ...params,
        status: 'pending'
      });

      // 4. Emit event
      await outbox.emit('BookingCreated', booking, trx);

      return booking;
    } finally {
      // Release lock will happen via TTL
    }
  });
}

CANCELLATION POLICY:
async function cancelBooking(bookingId: string, userId: string) {
  const booking = await getBooking(bookingId);

  // Check cancellation window
  const hoursUntil = differenceInHours(booking.start_at, new Date());
  if (hoursUntil < 24) {
    throw new CancellationNotAllowedError('Cannot cancel less than 24h before appointment');
  }

  return db.transaction(async (trx) => {
    // Update booking
    await trx('bookings')
      .where('id', bookingId)
      .update({ status: 'cancelled' });

    // Refund
    await refundService.initiateRefund(booking.order_line_item_id, trx);

    // Notify provider
    await notificationService.send({
      type: 'booking_cancelled',
      providerId: booking.provider_id,
      bookingId: bookingId
    });
  });
}

REMINDERS:
@Cron('0 * * * *')  // каждый час
async function sendReminders() {
  // Напоминания за 24 часа
  const tomorrow = addHours(new Date(), 24);
  const bookings = await db('bookings')
    .whereBetween('start_at', [tomorrow, addHours(tomorrow, 1)])
    .where('status', 'confirmed')
    .whereNull('reminder_sent_at');

  for (const booking of bookings) {
    await notificationService.send({
      type: 'booking_reminder',
      customerId: booking.customer_id,
      booking: booking
    });

    await db('bookings')
      .where('id', booking.id)
      .update({ reminder_sent_at: new Date() });
  }
}

API:
GET    /api/v1/services
GET    /api/v1/services/:id/available-slots?date=2024-07-15
POST   /api/v1/bookings
GET    /api/v1/bookings/:id
POST   /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/reschedule

PROVIDER API:
GET    /api/v1/provider/schedule
PUT    /api/v1/provider/schedule
GET    /api/v1/provider/bookings
POST   /api/v1/provider/bookings/:id/complete
POST   /api/v1/provider/bookings/:id/no-show

РЕЗУЛЬТАТ:
- Система расписаний с исключениями
- Atomic slot reservations
- Cancellation policy
- Автоматические reminders
- ICS calendar export
```

---

## 🔍 Testing & Quality

### Промпт TEST-1: Testing Strategy

```
Создай комплексную стратегию тестирования:

УРОВНИ ТЕСТИРОВАНИЯ:
1. Unit Tests (Jest):
   - Services, repositories
   - Business logic functions
   - Validators, transformers
   - Target coverage: >80%

2. Integration Tests:
   - API endpoints
   - Database operations
   - External service mocks
   - Target coverage: >70%

3. E2E Tests (Supertest):
   - Complete user journeys
   - Happy paths + edge cases
   - Critical flows: checkout, payment
   - Target coverage: >50% of critical paths

SETUP:
// test/setup.ts
beforeAll(async () => {
  // Start test database
  await startTestDb();

  // Run migrations
  await runMigrations();

  // Seed test data
  await seedTestData();
});

afterAll(async () => {
  await cleanupTestDb();
});

beforeEach(async () => {
  // Clean tables but keep schema
  await truncateTables();
});

FIXTURES:
// test/fixtures/users.fixture.ts
export const testUsers = {
  buyer: {
    email: 'buyer@test.com',
    password: 'Test123!@#',
    locale: 'en',
    currency: 'USD'
  },
  merchant: {
    email: 'merchant@test.com',
    password: 'Test123!@#',
    role: 'merchant'
  },
  admin: {
    email: 'admin@test.com',
    password: 'Test123!@#',
    role: 'admin'
  }
};

MOCKING EXTERNAL SERVICES:
// test/mocks/stripe.mock.ts
export const mockStripeProvider = {
  createPaymentIntent: jest.fn().mockResolvedValue({
    id: 'pi_test_123',
    status: 'requires_payment_method',
    client_secret: 'pi_test_secret'
  }),

  capturePayment: jest.fn().mockResolvedValue({
    success: true,
    amount: 10000
  })
};

ПРИМЕРЫ ТЕСТОВ:

// Unit test
describe('OrderService', () => {
  let service: OrderService;
  let repository: MockRepository<Order>;

  beforeEach(() => {
    repository = createMockRepository();
    service = new OrderService(repository);
  });

  describe('createOrder', () => {
    it('should create order with line items', async () => {
      const checkoutSession = createTestCheckoutSession();
      const order = await service.createOrder(checkoutSession.id);

      expect(order.lineItems).toHaveLength(3);
      expect(order.status).toBe('pending');
    });

    it('should throw if session expired', async () => {
      const expiredSession = createExpiredSession();

      await expect(
        service.createOrder(expiredSession.id)
      ).rejects.toThrow(SessionExpiredError);
    });
  });
});

// Integration test
describe('POST /api/v1/orders', () => {
  it('should create order from checkout session', async () => {
    const session = await createCheckoutSession(testUser);

    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send({ checkoutSessionId: session.id })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      status: 'pending',
      lineItems: expect.arrayContaining([
        expect.objectContaining({
          status: 'pending',
          type: 'physical'
        })
      ])
    });

    // Verify database
    const order = await db('orders').where('id', response.body.id).first();
    expect(order).toBeDefined();
  });
});

// E2E test
describe('Complete checkout flow', () => {
  it('should complete purchase end-to-end', async () => {
    // 1. Register user
    const user = await registerUser(testUsers.buyer);

    // 2. Browse catalog
    const products = await getProducts();

    // 3. Add to cart
    await addToCart(user, products[0]);

    // 4. Start checkout
    const session = await createCheckoutSession(user);

    // 5. Add shipping address
    await updateShipping(session, testAddress);

    // 6. Complete checkout
    const order = await completeCheckout(session, testPaymentMethod);

    // 7. Verify order created
    expect(order.status).toBe('pending');

    // 8. Simulate payment webhook
    await simulatePaymentSuccess(order.paymentId);

    // 9. Verify order updated
    const updatedOrder = await getOrder(order.id);
    expect(updatedOrder.lineItems[0].status).toBe('payment_confirmed');
  });
});

CI CONFIGURATION:
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}

// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts'
  ]
};

РЕЗУЛЬТАТ:
- Полное покрытие тестами
- Fixtures для всех сущностей
- Mocks для external services
- CI integration
```

---

## 📚 Дополнительные промпты

### Промпт DOCS-1: API Documentation

```
Создай полную Swagger/OpenAPI документацию:

ТРЕБОВАНИЯ:
1. Swagger UI доступен на /api/docs
2. Описание всех endpoints с примерами
3. Request/Response schemas
4. Authentication flows
5. Error responses

SETUP:
@Module({
  imports: [
    DocumentBuilder
      .setTitle('SnailMarketplace API')
      .setDescription('Universal marketplace for goods, services, and courses')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('products', 'Product catalog')
      .addTag('cart', 'Shopping cart')
      .addTag('orders', 'Order management')
      .addTag('payments', 'Payment processing')
      .build()
  ]
})

ПРИМЕРЫ:
@ApiOperation({ summary: 'Create new order' })
@ApiResponse({
  status: 201,
  description: 'Order created successfully',
  type: OrderDto
})
@ApiResponse({
  status: 400,
  description: 'Invalid checkout session'
})
@ApiBearerAuth()
@Post()
async createOrder(@Body() dto: CreateOrderDto) {
  return this.orderService.create(dto);
}
```

### Промпт MONITOR-1: Monitoring & Observability

```
Настрой мониторинг и observability:

МЕТРИКИ (Prometheus):
- Business metrics:
  - checkout_started_total
  - checkout_completed_total
  - checkout_abandoned_total
  - payment_success_rate
  - order_value_histogram

- Technical metrics:
  - http_request_duration_seconds
  - http_requests_total
  - db_query_duration_seconds
  - cache_hit_rate
  - outbox_lag_seconds

ЛОГИРОВАНИЕ (Winston):
- Structured JSON logs
- Correlation IDs
- Log levels: error, warn, info, debug
- Log aggregation (ELK/Loki)

TRACING (OpenTelemetry):
- Distributed tracing
- Span для каждого запроса
- Database queries
- External API calls

АЛЕРТЫ (Prometheus Alertmanager):
- Payment failure rate > 5%
- Checkout completion rate < 70%
- API p95 latency > 1s
- Database connections > 80%
- Outbox lag > 5 minutes

GRAFANA DASHBOARDS:
1. Business Overview
2. Technical Health
3. Payment Processing
4. Order Fulfillment
```

---

## 🎯 Итоговый промпт для полной реализации

### Промпт FULL: Complete MVP Implementation

```
Реализуй полный MVP маркетплейса SnailMarketplace:

КОНТЕКСТ:
- Прочитай docs/SnailMarketplace_MVP_Architecture.md
- Следуй docs/OVERVIEW.md для timeline
- Используй промпты выше для каждого спринта

АРХИТЕКТУРА:
- BFF + Modular Monolith
- PostgreSQL + Redis + S3
- NestJS + TypeScript
- GraphQL + REST

ПРИОРИТЕТЫ:
1. Sprint 0-2: Foundation (4 недели)
2. Sprint 3-5: Core business (6 недель)
3. Sprint 6: Bookings (2 недели)
4. Testing & Deploy (2 недели)

КАЧЕСТВО:
- Test coverage >80%
- Type safety (strict TypeScript)
- Security best practices
- Performance: p95 <500ms
- Documentation (Swagger + README)

ПОЭТАПНЫЙ ПЛАН:
1. Начни с промпта 0.1 (Project setup)
2. После завершения каждого спринта - code review
3. Integration testing перед переходом к следующему
4. Continuous deployment в staging

ДОПОЛНИТЕЛЬНЫЕ ТРЕБОВАНИЯ:
- Мультиязычность (EN/RU/AR)
- RTL support для Arabic
- Региональные платежные методы
- Compliance (GDPR, PCI DSS basics)

ИТОГОВЫЙ РЕЗУЛЬТАТ:
Production-ready MVP через 14-16 недель
```

---

## 📝 Примечания по использованию

1. **Порядок выполнения**: Следуйте последовательности спринтов
2. **Итеративность**: После каждого промпта проверяйте результат
3. **Контекст**: Всегда прикладывайте соответствующие документы
4. **Кастомизация**: Адаптируйте промпты под свои нужды
5. **Code review**: AI может ошибаться, всегда проверяйте код

---

**Готово к использованию!** 🚀

Эти промпты покрывают 95% функционала MVP и могут использоваться с любым AI coding assistant (Claude, ChatGPT, Cursor, GitHub Copilot).
