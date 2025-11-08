# Архитектура универсального маркетплейса v2.0
## С учетом архитектурного review и требований рынков ОАЭ/РФ

**Версия:** 2.0  
**Дата:** 2024-11-08  
**Целевые рынки:** ОАЭ (Арабские Эмираты), Российская Федерация  

---

## Содержание

1. [Executive Summary](#1-executive-summary)
2. [Бизнес-контекст и требования](#2-бизнес-контекст-и-требования)
3. [Архитектурная стратегия](#3-архитектурная-стратегия)
4. [Модель данных маркетплейса](#4-модель-данных-маркетплейса)
5. [Платежная система](#5-платежная-система)
6. [Сервисная архитектура](#6-сервисная-архитектура)
7. [Мультиязычность и локализация](#7-мультиязычность-и-локализация)
8. [Региональные требования](#8-региональные-требования)
9. [База данных и консистентность](#9-база-данных-и-консистентность)
10. [Безопасность и комплаенс](#10-безопасность-и-комплаенс)
11. [Инфраструктура и DevOps](#11-инфраструктура-и-devops)
12. [План развертывания](#12-план-развертывания)
13. [Метрики и мониторинг](#13-метрики-и-мониторинг)
14. [Оценка рисков](#14-оценка-рисков)

---

## 1. Executive Summary

### 1.1 Ключевые изменения v2.0

- ✅ **Упрощенная стартовая архитектура**: BFF + минимум сервисов вместо полной микросервисной архитектуры
- ✅ **Split-платежи и escrow**: Полноценная модель маркетплейса с выплатами продавцам
- ✅ **Line-item ориентированные заказы**: FSM для каждого типа товара/услуги
- ✅ **Мультиязычность**: RTL поддержка для арабского, полная локализация
- ✅ **Региональная адаптация**: Фискализация (РФ), VAT (ОАЭ), локальные платежные методы
- ✅ **Консистентность данных**: Явные стратегии для инвентаря и бронирований

### 1.2 Целевые метрики

```yaml
Производительность:
  - Latency p95: < 200ms
  - Checkout success rate: > 95%
  - Search response time: < 100ms
  
Масштабируемость:
  - Concurrent users: 100K → 1M
  - Products: 10K → 1M
  - Orders/day: 1K → 100K
  
Доступность:
  - Uptime SLA: 99.9%
  - RTO: < 1 hour
  - RPO: < 5 minutes
```

---

## 2. Бизнес-контекст и требования

### 2.1 Модель маркетплейса

```typescript
interface MarketplaceModel {
  // Участники
  participants: {
    platform: "SnailMarketplace";  // Оператор платформы
    merchants: Merchant[];          // Продавцы товаров/курсов
    serviceProviders: Provider[];   // Салоны, барбершопы
    customers: Customer[];           // Покупатели
  };
  
  // Финансовая модель
  revenue: {
    commissionRate: {
      physical: 0.15,     // 15% с товаров
      digital: 0.20,      // 20% с курсов
      services: 0.10      // 10% с услуг
    };
    payoutSchedule: "weekly" | "biweekly";
    escrowPeriod: Duration<7, "days">;
  };
  
  // Юридическая структура
  legal: {
    platformRole: "marketplace_operator";
    contractType: "agency_agreement";
    disputeResolution: "platform_arbitration";
  };
}
```

### 2.2 Функциональные требования

#### Для покупателей
- Поиск и фильтрация на 3 языках (EN/AR/RU)
- Единая корзина для разных типов товаров
- Множественные способы оплаты
- Отслеживание заказов и бронирований
- Система отзывов и рейтингов

#### Для продавцов/провайдеров
- Личный кабинет с аналитикой
- Управление каталогом и инвентарем
- Календарь для услуг
- Финансовая отчетность
- Вывод средств

#### Для платформы
- Управление комиссиями
- Модерация контента
- Разрешение споров
- Compliance и отчетность
- Антифрод

---

## 3. Архитектурная стратегия

### 3.1 Эволюционный подход

```mermaid
graph LR
    subgraph "Phase 1: MVP (2 месяца)"
        MVP[Modular Monolith<br/>+ BFF]
    end
    
    subgraph "Phase 2: Growth (3-6 месяцев)"
        PARTIAL[Core Services<br/>Extraction]
    end
    
    subgraph "Phase 3: Scale (6-12 месяцев)"
        FULL[Full Microservices<br/>+ Federation]
    end
    
    MVP --> PARTIAL --> FULL
```

### 3.2 Phase 1: MVP Architecture (Текущий фокус)

```yaml
Architecture:
  Backend:
    - BFF API (NestJS + TypeScript)
    - Modular monolith with Domain modules
    - GraphQL for client APIs
    - REST for webhooks/integrations
    
  Database:
    - PostgreSQL (primary datastore)
    - Redis (cache + sessions + locks)
    - S3 (media storage)
    
  Infrastructure:
    - Docker + Kubernetes (EKS/GKE)
    - AWS SQS for async jobs
    - CloudFront CDN
    
  External:
    - Stripe Connect (split payments)
    - СБП/ЮKassa (Russia)
    - Network International (UAE)
```

### 3.3 Модульная структура монолита

```typescript
// Структура модулей в монолите
src/
├── modules/
│   ├── user/          // Пользователи и аутентификация
│   ├── merchant/      // Управление продавцами
│   ├── catalog/       // Товары, курсы, услуги
│   ├── inventory/     // Складские остатки
│   ├── booking/       // Бронирование услуг
│   ├── order/         // Обработка заказов
│   ├── payment/       // Платежи и выплаты
│   ├── notification/  // Уведомления
│   └── analytics/     // Аналитика
├── shared/
│   ├── database/      // Repositories, entities
│   ├── i18n/          // Локализация
│   ├── security/      // Auth, crypto
│   └── utils/         // Helpers
└── infrastructure/
    ├── queue/         // SQS integration
    ├── cache/         // Redis
    └── storage/       // S3
```

---

## 4. Модель данных маркетплейса

### 4.1 Универсальная модель заказа

```typescript
// Line-item ориентированная модель с FSM
interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  lineItems: LineItem[];
  payment: PaymentInfo;
  totals: OrderTotals;
  createdAt: Date;
  metadata: {
    ip: string;
    userAgent: string;
    currency: "AED" | "RUB" | "USD";
    locale: "en" | "ar" | "ru";
  };
}

interface LineItem {
  id: string;
  type: "physical" | "digital" | "service";
  merchantId: string;
  productId: string;
  quantity: number;
  price: Money;
  status: LineItemStatus;
  fulfillment: FulfillmentInfo;
  
  // Специфичные данные по типу
  details: PhysicalItem | DigitalItem | ServiceItem;
}

// FSM для каждого типа line item
enum PhysicalItemStatus {
  PENDING = "pending",
  INVENTORY_RESERVED = "inventory_reserved",
  PAYMENT_AUTHORIZED = "payment_authorized",
  PAYMENT_CAPTURED = "payment_captured",
  PREPARING = "preparing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}

enum ServiceItemStatus {
  PENDING = "pending",
  SLOT_RESERVED = "slot_reserved",
  PAYMENT_AUTHORIZED = "payment_authorized",
  CONFIRMED = "confirmed",
  PAYMENT_CAPTURED = "payment_captured",
  COMPLETED = "completed",
  NO_SHOW = "no_show",
  CANCELLED = "cancelled",
  REFUNDED = "refunded"
}
```

### 4.2 Инвентарь и резервирование

```typescript
interface InventoryReservation {
  id: string;
  productId: string;
  orderId: string;
  quantity: number;
  status: "active" | "expired" | "confirmed" | "cancelled";
  expiresAt: Date;
  createdAt: Date;
}

class InventoryService {
  async reserveItems(
    items: ReservationRequest[],
    ttl: number = 900 // 15 минут
  ): Promise<ReservationResult> {
    const reservationId = generateIdempotencyKey();
    
    return this.db.transaction(async (trx) => {
      // Проверка доступности с пессимистической блокировкой
      const inventory = await trx
        .select('*')
        .from('inventory')
        .whereIn('product_id', items.map(i => i.productId))
        .forUpdate();
      
      // Проверка наличия
      const unavailable = items.filter(item => {
        const stock = inventory.find(i => i.product_id === item.productId);
        return !stock || stock.available < item.quantity;
      });
      
      if (unavailable.length > 0) {
        throw new InsufficientInventoryError(unavailable);
      }
      
      // Создание резервов
      const reservations = await trx
        .insert(items.map(item => ({
          id: uuid(),
          reservation_id: reservationId,
          product_id: item.productId,
          quantity: item.quantity,
          expires_at: new Date(Date.now() + ttl * 1000),
          status: 'active'
        })))
        .into('inventory_reservations')
        .returning('*');
      
      // Обновление доступного количества
      await Promise.all(items.map(item =>
        trx('inventory')
          .where('product_id', item.productId)
          .decrement('available', item.quantity)
      ));
      
      // Планирование автоматического освобождения
      await this.scheduleReservationExpiry(reservationId, ttl);
      
      return {
        reservationId,
        reservations,
        expiresAt: new Date(Date.now() + ttl * 1000)
      };
    });
  }
}
```

### 4.3 Бронирование услуг

```typescript
interface BookingSlot {
  id: string;
  providerId: string;
  specialistId?: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  status: SlotStatus;
  customerId?: string;
  orderId?: string;
  timezone: string; // Важно для ОАЭ/РФ
}

class BookingService {
  async reserveSlot(
    request: BookingRequest
  ): Promise<BookingResult> {
    const lockKey = `booking:${request.providerId}:${request.slotId}`;
    
    // Distributed lock через Redis
    const lock = await this.redis.acquireLock(lockKey, 5000);
    
    try {
      // Проверка доступности слота
      const slot = await this.db
        .select('*')
        .from('booking_slots')
        .where('id', request.slotId)
        .first();
      
      if (slot.status !== 'available') {
        throw new SlotUnavailableError();
      }
      
      // Резервирование слота
      await this.db.transaction(async (trx) => {
        await trx('booking_slots')
          .where('id', request.slotId)
          .update({
            status: 'reserved',
            customer_id: request.customerId,
            order_id: request.orderId,
            reserved_at: new Date(),
            expires_at: new Date(Date.now() + 15 * 60 * 1000)
          });
        
        // Создание записи о бронировании
        await trx('bookings').insert({
          id: uuid(),
          slot_id: request.slotId,
          customer_id: request.customerId,
          service_id: request.serviceId,
          status: 'pending_payment',
          metadata: request.metadata
        });
      });
      
      return { success: true, slotId: request.slotId };
    } finally {
      await lock.release();
    }
  }
}
```

---

## 5. Платежная система

### 5.1 Split-платежи и маркетплейс модель

```typescript
interface MarketplacePayment {
  id: string;
  orderId: string;
  totalAmount: Money;
  currency: "AED" | "RUB" | "USD";
  
  splits: PaymentSplit[];
  
  escrow: {
    enabled: boolean;
    releaseDate: Date;
    conditions: EscrowCondition[];
  };
  
  fees: {
    platform: Money;
    payment: Money;
    tax: Money;
  };
  
  timeline: {
    authorized: Date;
    captured?: Date;
    splitExecuted?: Date;
    settled?: Date;
  };
}

interface PaymentSplit {
  merchantId: string;
  amount: Money;
  platformFee: Money;
  netPayout: Money;
  status: "pending" | "processing" | "completed" | "failed";
  payoutDate?: Date;
  reference?: string;
}

class PaymentService {
  async processMarketplacePayment(
    order: Order
  ): Promise<MarketplacePayment> {
    // Расчет split-платежей
    const splits = this.calculateSplits(order);
    
    // Выбор процессора по региону
    const processor = this.getPaymentProcessor(order.metadata.currency);
    
    if (processor === 'stripe_connect') {
      return this.processStripeConnect(order, splits);
    } else if (processor === 'yookassa') {
      return this.processYooKassa(order, splits);
    } else if (processor === 'network_international') {
      return this.processNetworkIntl(order, splits);
    }
  }
  
  private calculateSplits(order: Order): PaymentSplit[] {
    const groupedByMerchant = _.groupBy(order.lineItems, 'merchantId');
    
    return Object.entries(groupedByMerchant).map(([merchantId, items]) => {
      const subtotal = items.reduce((sum, item) => 
        sum + item.price.amount * item.quantity, 0
      );
      
      const commissionRate = this.getCommissionRate(items[0].type);
      const platformFee = subtotal * commissionRate;
      const netPayout = subtotal - platformFee;
      
      return {
        merchantId,
        amount: { amount: subtotal, currency: order.metadata.currency },
        platformFee: { amount: platformFee, currency: order.metadata.currency },
        netPayout: { amount: netPayout, currency: order.metadata.currency },
        status: 'pending',
        payoutDate: this.calculatePayoutDate(order)
      };
    });
  }
  
  async handleWebhook(
    provider: string,
    payload: any,
    signature: string
  ): Promise<void> {
    // Проверка подписи
    if (!this.verifyWebhookSignature(provider, payload, signature)) {
      throw new InvalidWebhookSignatureError();
    }
    
    // Идемпотентность
    const eventId = payload.id || payload.event_id;
    const processed = await this.redis.get(`webhook:${eventId}`);
    if (processed) {
      return; // Уже обработан
    }
    
    await this.redis.setex(`webhook:${eventId}`, 86400, '1');
    
    // Обработка события
    await this.processWebhookEvent(provider, payload);
  }
}
```

### 5.2 Региональные платежные методы

```yaml
UAE:
  providers:
    - Network International
    - PayTabs
    - Telr
  methods:
    - Cards (Visa, Mastercard, AMEX)
    - Apple Pay / Google Pay
    - BNPL (Tabby, Tamara)
    - Cash on Delivery
  compliance:
    - VAT (5%)
    - Economic Substance Regulations
    - Central Bank regulations

Russia:
  providers:
    - ЮKassa (Яндекс.Касса)
    - CloudPayments
    - Тинькофф Касса
  methods:
    - Банковские карты (Мир, Visa, MC)
    - СБП (Система быстрых платежей)
    - ЮMoney
    - QIWI
    - Наложенный платеж
  compliance:
    - Фискализация (54-ФЗ)
    - Онлайн-кассы
    - НДС (20%)
    - Персональные данные (152-ФЗ)
```

### 5.3 Reconciliation и отчетность

```typescript
interface ReconciliationService {
  // Ежедневная сверка
  async dailyReconciliation(): Promise<ReconciliationReport> {
    const date = new Date();
    
    // Сбор данных из всех источников
    const internal = await this.getInternalTransactions(date);
    const stripe = await this.getStripeTransactions(date);
    const yookassa = await this.getYooKassaTransactions(date);
    
    // Сопоставление
    const matched = this.matchTransactions(internal, [stripe, yookassa]);
    const discrepancies = this.findDiscrepancies(matched);
    
    // Генерация отчета
    return {
      date,
      totalTransactions: internal.length,
      matched: matched.filter(m => m.status === 'matched').length,
      discrepancies: discrepancies,
      actions: this.generateActions(discrepancies)
    };
  }
  
  // Выплаты мерчантам
  async processMerchantPayouts(): Promise<PayoutBatch> {
    const eligiblePayouts = await this.getEligiblePayouts();
    
    const batch = await this.db.transaction(async (trx) => {
      const batchId = uuid();
      
      // Создание батча выплат
      await trx('payout_batches').insert({
        id: batchId,
        status: 'processing',
        total_amount: eligiblePayouts.reduce((sum, p) => sum + p.amount, 0),
        created_at: new Date()
      });
      
      // Обработка каждой выплаты
      for (const payout of eligiblePayouts) {
        await this.processSinglePayout(payout, batchId, trx);
      }
      
      return batchId;
    });
    
    // Асинхронное выполнение выплат
    await this.queue.send('process-payout-batch', { batchId: batch });
    
    return batch;
  }
}
```

---

## 6. Сервисная архитектура

### 6.1 Backend for Frontend (BFF)

```typescript
@Module({
  imports: [
    GraphQLModule.forRoot({
      autoSchemaFile: true,
      context: ({ req }) => ({ 
        req, 
        locale: req.headers['accept-language'],
        currency: req.headers['x-currency']
      }),
      plugins: [
        depthLimit(5),
        costAnalysis({
          maximumCost: 1000,
          defaultCost: 1
        })
      ],
      persistedQueries: {
        cache: new RedisCache({
          client: redis
        })
      }
    }),
    UserModule,
    CatalogModule,
    OrderModule,
    PaymentModule,
    BookingModule,
    NotificationModule
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        IdempotencyMiddleware,
        LocalizationMiddleware,
        RateLimitMiddleware
      )
      .forRoutes('*');
  }
}
```

### 6.2 Idempotency Layer

```typescript
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService
  ) {}
  
  async use(req: Request, res: Response, next: NextFunction) {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;
    
    if (!idempotencyKey && this.requiresIdempotency(req)) {
      throw new BadRequestException('X-Idempotency-Key header required');
    }
    
    if (idempotencyKey) {
      const cached = await this.redis.get(`idempotency:${idempotencyKey}`);
      
      if (cached) {
        const response = JSON.parse(cached);
        return res.status(response.status).json(response.body);
      }
      
      // Сохраняем ответ после обработки
      const originalJson = res.json;
      res.json = function(body: any) {
        const response = {
          status: res.statusCode,
          body,
          timestamp: new Date()
        };
        
        this.redis.setex(
          `idempotency:${idempotencyKey}`,
          86400, // 24 часа
          JSON.stringify(response)
        );
        
        return originalJson.call(this, body);
      }.bind(this);
    }
    
    next();
  }
  
  private requiresIdempotency(req: Request): boolean {
    const criticalEndpoints = [
      '/orders/checkout',
      '/payments/process',
      '/bookings/reserve'
    ];
    
    return req.method === 'POST' && 
           criticalEndpoints.some(ep => req.path.includes(ep));
  }
}
```

### 6.3 Модульная организация

```typescript
// Пример модуля каталога
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      ProductTranslation,
      ProductVariant
    ]),
    ElasticsearchModule,
    CacheModule,
    S3Module
  ],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    ProductSearchService,
    CategoryService,
    TranslationService
  ],
  exports: [CatalogService]
})
export class CatalogModule {}

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private searchService: ProductSearchService,
    private translationService: TranslationService,
    private cache: CacheService
  ) {}
  
  async getProduct(
    id: string, 
    locale: string = 'en'
  ): Promise<LocalizedProduct> {
    const cacheKey = `product:${id}:${locale}`;
    const cached = await this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['translations', 'variants', 'merchant']
    });
    
    if (!product) {
      throw new NotFoundException();
    }
    
    const localized = this.translationService.localize(product, locale);
    
    await this.cache.set(cacheKey, localized, 300); // 5 минут
    
    return localized;
  }
  
  async searchProducts(
    query: SearchQuery,
    locale: string
  ): Promise<SearchResult> {
    // Построение поискового запроса с учетом локали
    const searchParams = {
      ...query,
      locale,
      // Для арабского языка - особая обработка
      analyzer: locale === 'ar' ? 'arabic' : 'standard'
    };
    
    return this.searchService.search(searchParams);
  }
}
```

---

## 7. Мультиязычность и локализация

### 7.1 Стратегия локализации

```typescript
interface LocalizationStrategy {
  // Поддерживаемые языки
  languages: {
    en: { name: "English", direction: "ltr", default: true },
    ar: { name: "العربية", direction: "rtl", calendar: "islamic" },
    ru: { name: "Русский", direction: "ltr", calendar: "gregorian" }
  };
  
  // Что локализуется
  content: {
    static: "i18n files",        // UI тексты
    dynamic: "database",         // Контент от продавцов
    generated: "templates",      // Email, SMS, документы
    media: "CDN with variants"   // Изображения с текстом
  };
  
  // Fallback стратегия
  fallback: {
    order: ["requested", "merchant_default", "en"],
    missing: "show_key_with_flag"
  };
}
```

### 7.2 Модель данных для мультиязычности

```sql
-- Основная таблица продуктов
CREATE TABLE products (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    sku VARCHAR(100),
    type VARCHAR(20),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Переводы продуктов
CREATE TABLE product_translations (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(500) NOT NULL,
    description TEXT,
    meta_title VARCHAR(200),
    meta_description TEXT,
    slug VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(product_id, locale),
    INDEX idx_locale_slug (locale, slug)
);

-- Переводы категорий
CREATE TABLE category_translations (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES categories(id),
    locale VARCHAR(5) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    slug VARCHAR(200),
    UNIQUE(category_id, locale),
    INDEX idx_locale_slug (locale, slug)
);

-- Метаданные для RTL языков
CREATE TABLE rtl_optimizations (
    entity_type VARCHAR(50),
    entity_id UUID,
    locale VARCHAR(5),
    rtl_image_url TEXT,
    rtl_specific_css TEXT,
    PRIMARY KEY(entity_type, entity_id, locale)
);
```

### 7.3 API локализации

```graphql
type Query {
  # Продукт с локализацией
  product(
    id: ID!
    locale: Locale = EN
  ): LocalizedProduct
  
  # Поиск с учетом языка
  searchProducts(
    query: String!
    locale: Locale = EN
    filters: ProductFilters
  ): ProductSearchResult
  
  # Переводы для UI
  translations(
    locale: Locale!
    namespace: String
  ): TranslationBundle
}

enum Locale {
  EN  # English
  AR  # العربية
  RU  # Русский
}

type LocalizedProduct {
  id: ID!
  name: String!
  description: String
  price: LocalizedPrice!
  images: [LocalizedImage!]!
  merchant: Merchant!
}

type LocalizedPrice {
  amount: Float!
  currency: Currency!
  formatted: String!  # "1,234.56 AED" или "1 234,56 ₽"
}

type LocalizedImage {
  url: String!
  alt: String
  isRTLOptimized: Boolean
}
```

### 7.4 Frontend локализация

```typescript
// Конфигурация i18n
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      ar: { translation: arTranslations },
      ru: { translation: ruTranslations }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (format === 'currency') {
          return formatCurrency(value, lng);
        }
        if (format === 'date') {
          return formatDate(value, lng);
        }
        return value;
      }
    }
  });

// RTL поддержка
function App() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  useEffect(() => {
    document.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language, isRTL]);
  
  return (
    <ThemeProvider theme={isRTL ? rtlTheme : ltrTheme}>
      <CssBaseline />
      <Router />
    </ThemeProvider>
  );
}

// Компонент с локализацией
function ProductCard({ product }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <Card sx={{ 
      textAlign: isRTL ? 'right' : 'left',
      direction: isRTL ? 'rtl' : 'ltr' 
    }}>
      <CardMedia
        image={isRTL && product.rtlImage ? product.rtlImage : product.image}
        title={product.name}
      />
      <CardContent>
        <Typography variant="h6">
          {product.name}
        </Typography>
        <Typography variant="body2">
          {product.description}
        </Typography>
        <Typography variant="h5" sx={{ mt: 2 }}>
          {formatPrice(product.price, i18n.language)}
        </Typography>
        <Button 
          variant="contained" 
          startIcon={!isRTL && <ShoppingCart />}
          endIcon={isRTL && <ShoppingCart />}
        >
          {t('product.addToCart')}
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 8. Региональные требования

### 8.1 Требования для ОАЭ

```typescript
interface UAECompliance {
  taxation: {
    vat: {
      rate: 0.05, // 5%
      registration: "Required for revenue > AED 375,000",
      reporting: "Quarterly",
      invoiceRequirements: {
        taxInvoiceNumber: true,
        trnNumber: true,
        customerTrn: "If B2B",
        itemizedVat: true
      }
    }
  };
  
  dataProtection: {
    framework: "ADGM Data Protection Regulations 2021",
    requirements: {
      consent: "Explicit",
      dataLocalization: "Preferred but not mandatory",
      breach: "72 hours notification",
      dpo: "Required for large scale processing"
    }
  };
  
  payment: {
    supportedMethods: ["cards", "applePay", "googlePay", "cod", "bnpl"],
    currencies: ["AED", "USD"],
    settlements: "T+2 business days"
  };
  
  ecommerce: {
    consumerProtection: "7 days return policy",
    priceDisplay: "Including VAT",
    arabicContent: "Recommended for government contracts"
  };
}
```

### 8.2 Требования для России

```typescript
interface RussiaCompliance {
  fiscalization: {
    law: "54-ФЗ",
    requirements: {
      onlineKassa: true,
      ofd: "Оператор фискальных данных",
      receipt: {
        format: "Электронный/бумажный чек",
        fields: [
          "ИНН продавца",
          "Наименование товара",
          "Цена с НДС",
          "QR-код",
          "Фискальный признак"
        ]
      }
    },
    integration: "АТОЛ Online / OrangeData"
  };
  
  dataProtection: {
    law: "152-ФЗ О персональных данных",
    requirements: {
      localization: "Mandatory for Russian citizens",
      consent: "Written consent required",
      operator: "Registration with Roskomnadzor",
      crossBorder: "Requires user consent"
    }
  };
  
  taxation: {
    nds: {
      rates: [0, 0.10, 0.20], // 0%, 10%, 20%
      reporting: "Quarterly",
      electronicInvoicing: "EDI system"
    },
    income: {
      witholding: "Platform as tax agent for individuals"
    }
  };
  
  payment: {
    supportedMethods: ["mir", "visa", "mastercard", "sbp", "yoomoney"],
    currencies: ["RUB"],
    settlements: "T+1 business day"
  };
}
```

### 8.3 Интеграция с фискальными системами

```typescript
// Сервис фискализации для России
@Injectable()
export class FiscalizationService {
  constructor(
    private readonly atolClient: AtolOnlineClient,
    private readonly config: ConfigService
  ) {}
  
  async createReceipt(order: Order): Promise<FiscalReceipt> {
    const receipt = {
      external_id: order.id,
      receipt: {
        client: {
          email: order.customer.email,
          phone: order.customer.phone
        },
        company: {
          email: this.config.get('fiscal.companyEmail'),
          inn: this.config.get('fiscal.inn'),
          payment_address: this.config.get('fiscal.paymentAddress'),
          sno: 'osn' // Система налогообложения
        },
        items: order.lineItems.map(item => ({
          name: item.name,
          price: item.price.amount,
          quantity: item.quantity,
          sum: item.price.amount * item.quantity,
          measurement_unit: 'шт',
          payment_method: 'full_payment',
          payment_object: this.getPaymentObject(item.type),
          vat: {
            type: 'vat20',
            sum: this.calculateVat(item.price.amount * item.quantity)
          }
        })),
        payments: [{
          type: 1, // Электронный платеж
          sum: order.total.amount
        }],
        total: order.total.amount
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await this.atolClient.sell(receipt);
    
    // Сохранение фискального признака
    await this.saveReceiptData(order.id, response);
    
    return response;
  }
  
  private getPaymentObject(type: string): string {
    const mapping = {
      'physical': 'commodity',
      'digital': 'intellectual_activity',
      'service': 'service'
    };
    return mapping[type] || 'commodity';
  }
  
  private calculateVat(amount: number): number {
    return amount * 0.20 / 1.20; // НДС 20% в цене
  }
}

// Сервис VAT для ОАЭ
@Injectable()
export class VATService {
  async generateTaxInvoice(order: Order): Promise<TaxInvoice> {
    const vatRate = 0.05;
    const vatAmount = order.subtotal.amount * vatRate;
    
    return {
      invoiceNumber: this.generateInvoiceNumber(),
      trn: this.config.get('uae.trn'),
      customerTrn: order.customer.trn, // Для B2B
      date: new Date(),
      items: order.lineItems.map(item => ({
        description: item.name,
        quantity: item.quantity,
        unitPrice: item.price.amount,
        vatRate: vatRate,
        vatAmount: item.price.amount * item.quantity * vatRate,
        total: item.price.amount * item.quantity * (1 + vatRate)
      })),
      subtotal: order.subtotal.amount,
      vatAmount: vatAmount,
      total: order.subtotal.amount + vatAmount
    };
  }
  
  private generateInvoiceNumber(): string {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const sequence = this.getNextSequence();
    return `${prefix}-${year}-${sequence.toString().padStart(8, '0')}`;
  }
}
```

---

## 9. База данных и консистентность

### 9.1 Стратегия консистентности

```yaml
Strong Consistency (ACID):
  - Платежи и финансовые транзакции
  - Инвентарь и резервирование
  - Бронирование слотов
  - Критические данные пользователей
  
Eventual Consistency:
  - Поисковые индексы
  - Кэши каталога
  - Аналитика и метрики
  - Рекомендации
  
Techniques:
  - 2PC для критических cross-service транзакций
  - Saga pattern для долгих процессов
  - Event sourcing для аудита
  - CQRS для разделения чтения/записи
```

### 9.2 Схема базы данных (PostgreSQL)

```sql
-- Основные таблицы
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    locale VARCHAR(5) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    business_name VARCHAR(500) NOT NULL,
    business_type VARCHAR(50), -- individual, company
    tax_id VARCHAR(100), -- ИНН для РФ, TRN для ОАЭ
    status VARCHAR(20) DEFAULT 'pending',
    commission_rate DECIMAL(5,4) DEFAULT 0.15,
    payout_schedule VARCHAR(20) DEFAULT 'weekly',
    bank_account JSONB, -- Зашифровано
    documents JSONB,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id),
    type VARCHAR(20) NOT NULL, -- physical, digital, service
    sku VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    base_price DECIMAL(19,4),
    currency VARCHAR(3),
    inventory_tracking BOOLEAN DEFAULT true,
    attributes JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_merchant_type (merchant_id, type),
    INDEX idx_status (status)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    subtotal DECIMAL(19,4),
    tax_amount DECIMAL(19,4),
    shipping_amount DECIMAL(19,4),
    total_amount DECIMAL(19,4),
    currency VARCHAR(3),
    payment_status VARCHAR(20),
    payment_method VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    merchant_id UUID REFERENCES merchants(id),
    product_id UUID REFERENCES products(id),
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(19,4),
    total_price DECIMAL(19,4),
    status VARCHAR(20) DEFAULT 'pending',
    fulfillment_status VARCHAR(20),
    fulfillment_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_order (order_id),
    INDEX idx_merchant (merchant_id),
    INDEX idx_status (status)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    amount DECIMAL(19,4),
    currency VARCHAR(3),
    status VARCHAR(20),
    provider VARCHAR(50), -- stripe, yookassa, network_intl
    provider_transaction_id VARCHAR(255),
    method VARCHAR(50), -- card, sbp, cash, etc
    splits JSONB, -- Детали split-платежей
    metadata JSONB DEFAULT '{}',
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_order (order_id),
    INDEX idx_provider_tx (provider, provider_transaction_id),
    INDEX idx_idempotency (idempotency_key)
);

CREATE TABLE merchant_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES merchants(id),
    period_start DATE,
    period_end DATE,
    gross_amount DECIMAL(19,4),
    commission_amount DECIMAL(19,4),
    net_amount DECIMAL(19,4),
    currency VARCHAR(3),
    status VARCHAR(20) DEFAULT 'pending',
    payout_method VARCHAR(50),
    payout_reference VARCHAR(255),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_merchant (merchant_id),
    INDEX idx_period (period_start, period_end),
    INDEX idx_status (status)
);

-- Бронирования
CREATE TABLE booking_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES merchants(id),
    specialist_id UUID,
    service_id UUID REFERENCES products(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    customer_id UUID REFERENCES users(id),
    order_id UUID REFERENCES orders(id),
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_provider_time (provider_id, start_time),
    INDEX idx_status (status),
    CONSTRAINT no_overlap EXCLUDE USING gist (
        provider_id WITH =,
        specialist_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status != 'cancelled')
);

-- Инвентарь
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) UNIQUE,
    quantity INTEGER DEFAULT 0,
    reserved INTEGER DEFAULT 0,
    available INTEGER GENERATED ALWAYS AS (quantity - reserved) STORED,
    low_stock_threshold INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_available (available),
    CHECK (reserved >= 0),
    CHECK (quantity >= reserved)
);

CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_group_id VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id),
    order_id UUID REFERENCES orders(id),
    quantity INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_group (reservation_group_id),
    INDEX idx_expires (expires_at),
    INDEX idx_status (status)
);
```

### 9.3 Оптимизация запросов

```typescript
// Использование индексов и оптимизация
class OptimizedQueries {
  // Пагинация через курсоры
  async getProducts(
    cursor?: string,
    limit: number = 20
  ): Promise<ProductPage> {
    const query = this.db
      .select('p.*', 't.name', 't.description')
      .from('products as p')
      .leftJoin('product_translations as t', function() {
        this.on('p.id', '=', 't.product_id')
          .andOn('t.locale', '=', this.db.raw('?', [locale]));
      })
      .where('p.status', 'active')
      .orderBy('p.created_at', 'desc')
      .limit(limit);
    
    if (cursor) {
      const [timestamp, id] = Buffer.from(cursor, 'base64')
        .toString()
        .split(':');
      
      query.where(function() {
        this.where('p.created_at', '<', timestamp)
          .orWhere(function() {
            this.where('p.created_at', '=', timestamp)
              .andWhere('p.id', '<', id);
          });
      });
    }
    
    const products = await query;
    
    const nextCursor = products.length === limit
      ? Buffer.from(
          `${products[products.length - 1].created_at}:${products[products.length - 1].id}`
        ).toString('base64')
      : null;
    
    return {
      items: products,
      nextCursor
    };
  }
  
  // Batch loading для GraphQL
  async batchLoadMerchants(ids: string[]): Promise<Merchant[]> {
    const merchants = await this.db
      .select('*')
      .from('merchants')
      .whereIn('id', ids);
    
    // Сохраняем порядок
    const merchantMap = _.keyBy(merchants, 'id');
    return ids.map(id => merchantMap[id]);
  }
  
  // Оптимизированная статистика
  async getDashboardStats(merchantId: string): Promise<Stats> {
    const stats = await this.db.raw(`
      WITH date_range AS (
        SELECT 
          date_trunc('day', generate_series(
            CURRENT_DATE - INTERVAL '30 days',
            CURRENT_DATE,
            '1 day'::interval
          )) AS date
      ),
      daily_orders AS (
        SELECT 
          date_trunc('day', o.created_at) AS date,
          COUNT(*) AS order_count,
          SUM(oi.total_price) AS revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.merchant_id = ?
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
          AND o.status != 'cancelled'
        GROUP BY date_trunc('day', o.created_at)
      )
      SELECT 
        dr.date,
        COALESCE(do.order_count, 0) AS orders,
        COALESCE(do.revenue, 0) AS revenue
      FROM date_range dr
      LEFT JOIN daily_orders do ON dr.date = do.date
      ORDER BY dr.date
    `, [merchantId]);
    
    return stats.rows;
  }
}
```

---

## 10. Безопасность и комплаенс

### 10.1 Стратегия безопасности

```typescript
interface SecurityFramework {
  authentication: {
    method: "JWT + Refresh Tokens",
    mfa: {
      enabled: true,
      methods: ["totp", "sms", "email"]
    },
    sessionManagement: {
      maxConcurrentSessions: 5,
      idleTimeout: "30 minutes",
      absoluteTimeout: "24 hours"
    }
  };
  
  authorization: {
    model: "RBAC with permissions",
    roles: ["customer", "merchant", "admin", "support"],
    policyEngine: "Casbin",
    dataIsolation: "Row Level Security"
  };
  
  encryption: {
    atRest: {
      algorithm: "AES-256-GCM",
      keyManagement: "AWS KMS / HashiCorp Vault"
    },
    inTransit: {
      protocol: "TLS 1.3",
      hsts: true,
      certificatePinning: "mobile apps"
    }
  };
  
  compliance: {
    standards: ["PCI DSS", "GDPR", "CCPA"],
    audit: {
      logging: "Immutable audit trail",
      retention: "7 years",
      monitoring: "Real-time anomaly detection"
    }
  };
}
```

### 10.2 Implementация безопасности

```typescript
// JWT с ротацией refresh токенов
@Injectable()
export class AuthService {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const user = await this.validateCredentials(credentials);
    
    // Проверка на подозрительную активность
    await this.checkSuspiciousActivity(user, credentials);
    
    const tokens = await this.generateTokens(user);
    
    // Сохраняем refresh токен с device fingerprint
    await this.saveRefreshToken(
      tokens.refreshToken,
      user.id,
      credentials.deviceFingerprint
    );
    
    // Логирование для аудита
    await this.auditLog.log({
      event: 'user.login',
      userId: user.id,
      ip: credentials.ip,
      userAgent: credentials.userAgent,
      success: true
    });
    
    return tokens;
  }
  
  async refreshTokens(
    refreshToken: string,
    deviceFingerprint: string
  ): Promise<AuthResponse> {
    // Проверка токена
    const tokenData = await this.validateRefreshToken(refreshToken);
    
    // Проверка на повторное использование
    if (tokenData.used) {
      // Возможная компрометация - отзываем все токены
      await this.revokeAllUserTokens(tokenData.userId);
      throw new SecurityException('Token reuse detected');
    }
    
    // Проверка device fingerprint
    if (tokenData.deviceFingerprint !== deviceFingerprint) {
      throw new SecurityException('Device mismatch');
    }
    
    // Генерируем новую пару токенов
    const newTokens = await this.generateTokens(tokenData.user);
    
    // Помечаем старый токен как использованный
    await this.markTokenAsUsed(refreshToken);
    
    // Сохраняем новый refresh токен
    await this.saveRefreshToken(
      newTokens.refreshToken,
      tokenData.userId,
      deviceFingerprint
    );
    
    return newTokens;
  }
  
  private async checkSuspiciousActivity(
    user: User,
    credentials: LoginDto
  ): Promise<void> {
    const recentAttempts = await this.getRecentLoginAttempts(
      user.id,
      credentials.ip
    );
    
    // Проверки
    const checks = [
      this.checkBruteForce(recentAttempts),
      this.checkGeoAnomaly(user, credentials.ip),
      this.checkDeviceAnomaly(user, credentials.deviceFingerprint),
      this.checkTimeAnomaly(user)
    ];
    
    const risks = await Promise.all(checks);
    const riskScore = risks.reduce((sum, risk) => sum + risk, 0);
    
    if (riskScore > 50) {
      // Требуем MFA
      throw new MfaRequiredException();
    }
    
    if (riskScore > 80) {
      // Блокируем вход
      throw new SecurityException('Suspicious activity detected');
    }
  }
}

// Шифрование чувствительных данных
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  
  async encrypt(data: string, context?: string): Promise<EncryptedData> {
    // Получаем ключ из KMS
    const dataKey = await this.kms.generateDataKey({
      KeyId: this.config.get('kms.keyId'),
      KeySpec: 'AES_256'
    });
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      dataKey.Plaintext,
      iv
    );
    
    if (context) {
      cipher.setAAD(Buffer.from(context));
    }
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      keyId: dataKey.KeyId,
      context
    };
  }
  
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    // Расшифровываем ключ
    const dataKey = await this.kms.decrypt({
      CiphertextBlob: Buffer.from(encryptedData.keyId, 'base64')
    });
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      dataKey.Plaintext,
      Buffer.from(encryptedData.iv, 'base64')
    );
    
    if (encryptedData.context) {
      decipher.setAAD(Buffer.from(encryptedData.context));
    }
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.ciphertext, 'base64')),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  }
}

// Аудит и мониторинг
@Injectable()
export class AuditService {
  async log(event: AuditEvent): Promise<void> {
    const entry: AuditLog = {
      id: uuid(),
      timestamp: new Date(),
      event: event.type,
      userId: event.userId,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      action: event.action,
      result: event.result,
      metadata: {
        ip: event.ip,
        userAgent: event.userAgent,
        ...event.metadata
      },
      hash: null
    };
    
    // Вычисляем hash для целостности
    const previousEntry = await this.getLastEntry();
    entry.hash = this.calculateHash(entry, previousEntry?.hash);
    
    // Сохраняем в immutable storage
    await this.saveToImmutableStorage(entry);
    
    // Проверка на аномалии
    if (this.isAnomalous(entry)) {
      await this.alertSecurityTeam(entry);
    }
  }
  
  private calculateHash(
    entry: AuditLog,
    previousHash?: string
  ): string {
    const data = JSON.stringify({
      ...entry,
      previousHash: previousHash || '0'
    });
    
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  private async saveToImmutableStorage(entry: AuditLog): Promise<void> {
    // Сохраняем в S3 с Object Lock
    await this.s3.putObject({
      Bucket: this.config.get('audit.bucket'),
      Key: `${entry.timestamp.toISOString()}/${entry.id}.json`,
      Body: JSON.stringify(entry),
      ObjectLockMode: 'COMPLIANCE',
      ObjectLockRetainUntilDate: new Date(
        Date.now() + 7 * 365 * 24 * 60 * 60 * 1000 // 7 лет
      )
    }).promise();
  }
}
```

---

## 11. Инфраструктура и DevOps

### 11.1 Kubernetes конфигурация

```yaml
# Deployment для BFF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: marketplace-bff
  namespace: production
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: marketplace-bff
  template:
    metadata:
      labels:
        app: marketplace-bff
        version: v2.0.0
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - marketplace-bff
              topologyKey: kubernetes.io/hostname
      containers:
      - name: bff
        image: marketplace/bff:v2.0.0
        ports:
        - containerPort: 3000
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: host
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        volumeMounts:
        - name: config
          mountPath: /app/config
          readOnly: true
      volumes:
      - name: config
        configMap:
          name: marketplace-config
      
---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: marketplace-bff-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketplace-bff
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 5
        periodSeconds: 60

---
# PodDisruptionBudget
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: marketplace-bff-pdb
  namespace: production
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: marketplace-bff
```

### 11.2 CI/CD Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - security
  - deploy-staging
  - integration-tests
  - deploy-production

variables:
  DOCKER_REGISTRY: registry.gitlab.com
  IMAGE_NAME: $DOCKER_REGISTRY/$CI_PROJECT_PATH

# Lint
lint:
  stage: lint
  image: node:18-alpine
  script:
    - npm ci
    - npm run lint
    - npm run format:check
  only:
    - merge_requests
    - main

# Unit Tests
test:unit:
  stage: test
  image: node:18-alpine
  services:
    - postgres:14
    - redis:7
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgresql://test:test@postgres:5432/test
    REDIS_URL: redis://redis:6379
  script:
    - npm ci
    - npm run test:unit
    - npm run test:cov
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

# Build Docker Image
build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $IMAGE_NAME:$CI_COMMIT_SHA .
    - docker tag $IMAGE_NAME:$CI_COMMIT_SHA $IMAGE_NAME:latest
    - echo $CI_REGISTRY_PASSWORD | docker login -u $CI_REGISTRY_USER --password-stdin $CI_REGISTRY
    - docker push $IMAGE_NAME:$CI_COMMIT_SHA
    - docker push $IMAGE_NAME:latest
  only:
    - main
    - tags

# Security Scanning
security:scan:
  stage: security
  image: aquasec/trivy:latest
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $IMAGE_NAME:$CI_COMMIT_SHA
  allow_failure: false
  only:
    - main

# Deploy to Staging
deploy:staging:
  stage: deploy-staging
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context $KUBE_CONTEXT_STAGING
    - kubectl set image deployment/marketplace-bff bff=$IMAGE_NAME:$CI_COMMIT_SHA -n staging
    - kubectl rollout status deployment/marketplace-bff -n staging
    - kubectl annotate deployment/marketplace-bff kubernetes.io/change-cause="$CI_COMMIT_MESSAGE" -n staging --overwrite
  environment:
    name: staging
    url: https://staging.marketplace.example.com
  only:
    - main

# Integration Tests
test:integration:
  stage: integration-tests
  image: node:18-alpine
  script:
    - npm ci
    - npm run test:e2e -- --baseUrl=$STAGING_URL
  dependencies:
    - deploy:staging
  only:
    - main

# Deploy to Production (Manual)
deploy:production:
  stage: deploy-production
  image: bitnami/kubectl:latest
  script:
    # Blue-Green Deployment
    - kubectl config use-context $KUBE_CONTEXT_PROD
    
    # Deploy to green environment
    - kubectl set image deployment/marketplace-bff-green bff=$IMAGE_NAME:$CI_COMMIT_SHA -n production
    - kubectl rollout status deployment/marketplace-bff-green -n production
    
    # Run smoke tests
    - npm run test:smoke -- --baseUrl=$GREEN_URL
    
    # Switch traffic (10% -> 50% -> 100%)
    - kubectl patch virtualservice marketplace-bff -n production --type merge -p '{"spec":{"http":[{"weight":10}]}}'
    - sleep 60
    - ./scripts/check-metrics.sh || exit 1
    
    - kubectl patch virtualservice marketplace-bff -n production --type merge -p '{"spec":{"http":[{"weight":50}]}}'
    - sleep 120
    - ./scripts/check-metrics.sh || exit 1
    
    - kubectl patch virtualservice marketplace-bff -n production --type merge -p '{"spec":{"http":[{"weight":100}]}}'
    
    # Update blue environment for next deployment
    - kubectl set image deployment/marketplace-bff-blue bff=$IMAGE_NAME:$CI_COMMIT_SHA -n production
    
  environment:
    name: production
    url: https://marketplace.example.com
  when: manual
  only:
    - tags
```

### 11.3 Мониторинг и алертинг

```yaml
# Prometheus rules
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: marketplace-alerts
  namespace: production
spec:
  groups:
  - name: availability
    interval: 30s
    rules:
    - alert: ServiceDown
      expr: up{job="marketplace-bff"} == 0
      for: 2m
      labels:
        severity: critical
        team: platform
      annotations:
        summary: "Service {{ $labels.instance }} is down"
        description: "{{ $labels.instance }} has been down for more than 2 minutes"
    
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
      for: 5m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value }} (> 5%) for 5 minutes"
    
    - alert: HighLatency
      expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
      for: 5m
      labels:
        severity: warning
        team: platform
      annotations:
        summary: "High latency detected"
        description: "95th percentile latency is {{ $value }}s (> 1s)"
  
  - name: business
    interval: 1m
    rules:
    - alert: LowCheckoutSuccessRate
      expr: rate(checkout_success_total[5m]) / rate(checkout_attempts_total[5m]) < 0.9
      for: 10m
      labels:
        severity: critical
        team: business
      annotations:
        summary: "Low checkout success rate"
        description: "Checkout success rate is {{ $value }} (< 90%)"
    
    - alert: PaymentFailuresHigh
      expr: rate(payment_failures_total[5m]) > 10
      for: 5m
      labels:
        severity: critical
        team: payments
      annotations:
        summary: "High payment failure rate"
        description: "Payment failures at {{ $value }} per second"
```

---

## 12. План развертывания

### 12.1 Phase 1: MVP (0-2 месяца)

```yaml
Week 1-2: Foundation
  - Setup development environment
  - Initialize project structure
  - Configure CI/CD pipeline
  - Setup staging environment

Week 3-4: Core Models
  - User authentication & profiles
  - Merchant onboarding
  - Basic product catalog
  - Multi-language support

Week 5-6: Order Flow
  - Shopping cart
  - Checkout process
  - Payment integration (Stripe)
  - Order management

Week 7-8: Testing & Launch
  - Integration testing
  - Performance testing
  - Security audit
  - Soft launch with limited users
```

### 12.2 Phase 2: Regional Features (2-4 месяца)

```yaml
Month 3: Russian Market
  - ЮKassa integration
  - Fiscal receipts (54-ФЗ)
  - СБП payment method
  - Russian localization

Month 4: UAE Market
  - Network International integration
  - VAT invoicing
  - Arabic localization & RTL
  - Local payment methods
```

### 12.3 Phase 3: Advanced Features (4-6 месяцев)

```yaml
Month 5: Services & Bookings
  - Booking system
  - Calendar management
  - Service providers dashboard
  - Automated reminders

Month 6: Courses & Digital
  - Course management
  - Video streaming
  - Progress tracking
  - Certificates
```

---

## 13. Метрики и мониторинг

### 13.1 SLI/SLO Definition

```yaml
Service Level Indicators:
  availability:
    metric: "uptime"
    target: 99.9%
    window: "30 days"
  
  latency:
    metric: "p95 response time"
    target: "< 200ms"
    window: "5 minutes"
  
  checkout_success:
    metric: "successful checkouts / total attempts"
    target: "> 95%"
    window: "1 hour"
  
  payment_success:
    metric: "successful payments / total attempts"
    target: "> 98%"
    window: "1 hour"

Error Budget:
  monthly_budget: 43.2 minutes # 99.9% SLA
  alert_threshold: 50% # Alert when 50% consumed
  freeze_threshold: 80% # Feature freeze at 80%
```

### 13.2 Dashboards

```typescript
// Grafana Dashboard Configuration
const dashboards = {
  operational: {
    panels: [
      {
        title: "Request Rate",
        query: "sum(rate(http_requests_total[5m])) by (service)",
        type: "graph"
      },
      {
        title: "Error Rate",
        query: "sum(rate(http_requests_total{status=~'5..'}[5m])) by (service)",
        type: "graph",
        alert: {
          condition: "above",
          threshold: 0.01
        }
      },
      {
        title: "Latency P95",
        query: "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
        type: "graph"
      },
      {
        title: "Active Users",
        query: "count(increase(user_activity_total[5m]))",
        type: "stat"
      }
    ]
  },
  
  business: {
    panels: [
      {
        title: "GMV (Gross Merchandise Value)",
        query: "sum(order_value_total)",
        type: "stat"
      },
      {
        title: "Orders per Hour",
        query: "sum(rate(orders_created_total[1h]))",
        type: "graph"
      },
      {
        title: "Conversion Funnel",
        queries: [
          "product_views_total",
          "add_to_cart_total",
          "checkout_started_total",
          "checkout_completed_total"
        ],
        type: "funnel"
      },
      {
        title: "Top Products",
        query: "topk(10, sum by (product_id) (order_items_total))",
        type: "table"
      }
    ]
  }
};
```

---

## 14. Оценка рисков

### 14.1 Технические риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| Перегрузка БД при пиковой нагрузке | Высокая | Критическое | Read replicas, connection pooling, кэширование |
| Race conditions в инвентаре | Средняя | Высокое | Пессимистические блокировки, идемпотентность |
| Сбой платежного провайдера | Низкая | Критическое | Fallback на альтернативные провайдеры |
| Утечка данных | Низкая | Критическое | Шифрование, аудит, pen-testing, bug bounty |
| DDoS атака | Средняя | Высокое | Cloudflare, rate limiting, автомасштабирование |

### 14.2 Бизнес-риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|-----------|
| Низкая конверсия | Средняя | Высокое | A/B тестирование, аналитика воронки |
| Мошенничество мерчантов | Средняя | Среднее | KYB проверки, escrow период, мониторинг |
| Регуляторные изменения | Средняя | Высокое | Юридический мониторинг, гибкая архитектура |
| Конкуренция | Высокая | Среднее | Уникальные features, лояльность, маркетинг |

### 14.3 План действий при инцидентах

```yaml
Incident Response:
  levels:
    - P1: Complete outage, > 10% users affected
    - P2: Partial outage, payments affected
    - P3: Degraded performance
    - P4: Minor issues
  
  escalation:
    P1:
      - On-call engineer (immediate)
      - Team lead (5 min)
      - CTO (15 min)
      - CEO (30 min)
    P2:
      - On-call engineer (immediate)
      - Team lead (15 min)
  
  communication:
    - Status page update within 5 minutes
    - Customer communication within 15 minutes
    - Post-mortem within 48 hours
  
  runbooks:
    - Database failover procedure
    - Payment provider switch
    - Cache flush and rebuild
    - Traffic throttling
    - Emergency deployment rollback
```

---

## Заключение

Версия 2.0 архитектуры учитывает все критические замечания из review:

✅ **Упрощенный старт** - BFF вместо полноценных микросервисов  
✅ **Split-платежи** - Полноценная модель маркетплейса  
✅ **Консистентность** - Явные стратегии для критических операций  
✅ **Региональная адаптация** - Фискализация РФ, VAT ОАЭ  
✅ **Мультиязычность** - RTL поддержка, полная локализация  
✅ **Безопасность** - Многоуровневая защита, аудит  
✅ **Оптимизация затрат** - PostgreSQL вместо MongoDB на старте  

Архитектура готова к реализации MVP за 2 месяца с последующим масштабированием до enterprise-уровня.

---

## Приложение A: Чеклист готовности к запуску

### Pre-Launch Checklist

#### Инфраструктура
- [ ] Kubernetes кластер настроен (multi-AZ)
- [ ] CI/CD pipeline работает
- [ ] Мониторинг и алерты настроены
- [ ] Бэкапы и восстановление протестированы
- [ ] SSL сертификаты установлены
- [ ] CDN настроен для статики
- [ ] Rate limiting настроен
- [ ] DDoS защита активирована

#### Безопасность
- [ ] Penetration testing проведен
- [ ] OWASP Top 10 проверено
- [ ] Secrets management настроен
- [ ] Аудит логи работают
- [ ] 2FA для админов включена
- [ ] Data encryption активировано
- [ ] GDPR/Privacy compliance проверено
- [ ] PCI DSS требования выполнены

#### Платежи и фискализация
- [ ] Stripe Connect настроен и протестирован
- [ ] ЮKassa интегрирована (для РФ)
- [ ] Network International подключен (для ОАЭ)
- [ ] Фискализация работает (54-ФЗ)
- [ ] VAT расчеты корректны
- [ ] Split-платежи протестированы
- [ ] Reconciliation процесс работает
- [ ] Chargeback процедуры определены

#### Локализация
- [ ] Все UI тексты переведены (EN/AR/RU)
- [ ] RTL layout работает корректно
- [ ] Форматирование валют корректно
- [ ] Даты в правильных форматах
- [ ] Email шаблоны локализованы
- [ ] SMS шаблоны подготовлены
- [ ] Документы (инвойсы, чеки) генерируются

#### Тестирование
- [ ] Unit тесты > 80% coverage
- [ ] Integration тесты пройдены
- [ ] E2E тесты основных сценариев
- [ ] Performance тесты (1000+ RPS)
- [ ] Load testing проведен
- [ ] Security scan пройден
- [ ] UAT с реальными пользователями

#### Бизнес-готовность
- [ ] Служба поддержки готова
- [ ] Документация для мерчантов
- [ ] Онбординг процесс работает
- [ ] KYC/KYB процедуры настроены
- [ ] Правила и условия утверждены
- [ ] Политика конфиденциальности
- [ ] SLA определены
- [ ] Процедуры возвратов описаны

#### Мониторинг запуска
- [ ] Real-time дашборды готовы
- [ ] Алерты для критических метрик
- [ ] On-call график составлен
- [ ] War room подготовлен
- [ ] Rollback план готов
- [ ] Коммуникационный план готов

---

## Приложение B: Команда и ресурсы

### Минимальная команда для MVP (15 человек)

#### Разработка (8)
- **Tech Lead** (1) - Архитектура, код-ревью
- **Backend Engineers** (3) - API, бизнес-логика
- **Frontend Engineers** (2) - Web приложение
- **Mobile Engineer** (1) - React Native app
- **DevOps Engineer** (1) - Инфраструктура, CI/CD

#### Продукт и дизайн (3)
- **Product Manager** (1) - Roadmap, приоритеты
- **UX/UI Designer** (1) - Интерфейсы, UX
- **Business Analyst** (1) - Требования, процессы

#### Качество и поддержка (4)
- **QA Engineers** (2) - Тестирование
- **Support Engineers** (2) - Клиентская поддержка

### Расширенная команда для масштабирования (+10)

#### Дополнительная разработка
- **Backend Engineers** (2)
- **Frontend Engineers** (1)
- **Mobile Engineer** (1)
- **Data Engineer** (1)

#### Специализированные роли
- **Security Engineer** (1)
- **Site Reliability Engineer** (1)
- **Payment Specialist** (1)
- **Localization Manager** (1)
- **QA Automation Engineer** (1)

### Бюджет на инфраструктуру (ежемесячно)

#### MVP Phase (первые 3 месяца)
```yaml
AWS/GCP:
  Compute (EKS/GKE): $400
  Database (RDS): $300
  Cache (ElastiCache): $150
  Storage (S3): $50
  CDN (CloudFront): $100
  Monitoring: $100
  Total: ~$1,100/месяц

External Services:
  Stripe: 2.9% + $0.30 per transaction
  SendGrid: $100
  Twilio: $150
  Cloudflare: $200
  Total: ~$450/месяц + transaction fees

Total Infrastructure: ~$1,550/месяц
```

#### Growth Phase (3-12 месяцев)
```yaml
AWS/GCP:
  Compute: $1,200
  Database: $800
  Cache: $400
  Storage: $200
  CDN: $300
  Search (Elasticsearch): $500
  Analytics (ClickHouse): $400
  Monitoring: $200
  Total: ~$4,000/месяц

External Services:
  Payment providers: transaction %
  Email/SMS: $500
  Security services: $500
  Third-party APIs: $300
  Total: ~$1,300/месяц + fees

Total Infrastructure: ~$5,300/месяц
```

### Timeline с milestones

```mermaid
gantt
    title Roadmap развития маркетплейса
    dateFormat YYYY-MM-DD
    
    section Foundation
    Project Setup           :2024-01-01, 14d
    Core Infrastructure     :14d
    Auth & User Management  :14d
    
    section MVP
    Product Catalog         :2024-02-01, 21d
    Shopping Cart          :14d
    Order Management       :21d
    Payment Integration    :14d
    
    section Regional
    Russian Market         :2024-03-15, 30d
    UAE Market            :30d
    Fiscalization         :21d
    
    section Features
    Booking System         :2024-05-01, 30d
    Course Platform       :30d
    Analytics Dashboard   :21d
    
    section Scale
    Performance Opt       :2024-06-15, 21d
    Microservices Split  :45d
    ML Recommendations    :30d
```

---

## Приложение C: Контакты и ссылки

### Полезные ресурсы

#### Документация
- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance-tips.html)

#### Платежные системы
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [ЮKassa API](https://yookassa.ru/developers)
- [Network International](https://www.network.ae/en/uae/developers)

#### Региональные требования
- [54-ФЗ о применении ККТ](http://www.consultant.ru/document/cons_doc_LAW_40572/)
- [UAE VAT Guidelines](https://tax.gov.ae/en/taxes/vat.aspx)
- [GDPR Compliance](https://gdpr.eu/)
- [Russian Personal Data Law 152-ФЗ](http://www.consultant.ru/document/cons_doc_LAW_61801/)

#### Инфраструктура
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/best-practices/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Google Cloud Architecture Guide](https://cloud.google.com/architecture)

### Инструменты разработки

#### Рекомендуемые IDE и расширения
```json
{
  "vscode": {
    "extensions": [
      "dbaeumer.vscode-eslint",
      "esbenp.prettier-vscode",
      "prisma.prisma",
      "graphql.vscode-graphql",
      "ms-azuretools.vscode-docker",
      "redhat.vscode-yaml"
    ]
  },
  "tools": [
    "Docker Desktop",
    "Postman / Insomnia",
    "TablePlus / DBeaver",
    "Redis Desktop Manager",
    "k9s (Kubernetes CLI)",
    "AWS CLI",
    "git-flow"
  ]
}
```

### Соглашения по коду

#### Naming Conventions
```typescript
// Файлы
user.entity.ts        // Entities
user.service.ts       // Services  
user.controller.ts    // Controllers
user.resolver.ts      // GraphQL Resolvers
create-user.dto.ts    // DTOs

// Классы и интерфейсы
class UserService { }
interface UserProfile { }
enum UserStatus { }
type UserRole = 'admin' | 'merchant' | 'customer';

// Переменные и функции
const userId: string
function getUserById(id: string): User
const isUserActive: boolean
```

#### Git Workflow
```bash
# Ветки
main              # Production
develop          # Development
feature/*        # Новые фичи
bugfix/*         # Исправления багов
hotfix/*         # Срочные исправления
release/*        # Подготовка релизов

# Commit messages
feat: add payment processing
fix: resolve cart calculation bug
docs: update API documentation
style: format code according to guidelines
refactor: restructure order service
test: add unit tests for auth
chore: update dependencies
```

### Определение готовности (Definition of Done)

#### Для User Story
- [ ] Код написан и соответствует стандартам
- [ ] Unit тесты написаны (coverage > 80%)
- [ ] Integration тесты пройдены
- [ ] Code review пройден
- [ ] Документация обновлена
- [ ] Локализация добавлена
- [ ] Merge в develop без конфликтов

#### Для Sprint
- [ ] Все User Stories завершены
- [ ] Regression тесты пройдены
- [ ] Performance тесты в норме
- [ ] Security scan пройден
- [ ] Demo подготовлено
- [ ] Развернуто на staging

#### Для Release
- [ ] Все функции протестированы
- [ ] UAT пройден
- [ ] Документация актуализирована
- [ ] Release notes подготовлены
- [ ] Rollback план готов
- [ ] Production deploy успешен

---

Данная архитектура обеспечивает баланс между быстрым стартом и возможностью масштабирования, учитывает специфику целевых рынков и создает прочную основу для развития маркетплейса.
