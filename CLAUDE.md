# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnailMarketplace is a modular monolith marketplace platform built with NestJS, PostgreSQL, Redis, and S3. It supports three product types: physical goods, digital products, and services. The platform features multi-language support (EN/RU/AR), FSM-based order management, and event-driven architecture with the Outbox pattern.

## Development Commands

### Setup and Running
```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, LocalStack, Adminer)
docker-compose up -d

# Run database migrations
npm run migration:run

# Start development server with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Build for production
npm run build

# Run production build
npm run start:prod
```

### Database Operations
```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Seed database
npm run seed
```

### Testing
```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test order.service.spec.ts

# Run tests matching pattern
npm test -- --testPathPattern=payment

# Debug tests
npm run test:debug
```

### Code Quality
```bash
# Lint and auto-fix
npm run lint

# Format code
npm run format
```

## Architecture

### Modular Monolith Structure

The codebase follows a modular monolith architecture with clear module boundaries:

- **Auth Module** - JWT-based authentication, password hashing with argon2
- **User Module** - User management with locale/currency preferences
- **Catalog Module** - Product catalog (physical, digital, service types)
- **Cart Module** - Shopping cart management
- **Checkout Module** - Multi-step checkout process with session management
- **Inventory Module** - Stock management and reservations
- **Booking Module** - Service appointment scheduling
- **Orders Module** - FSM-based order processing (see details below)
- **Payment Module** - Payment processing with provider abstraction
- **Payout Module** - Merchant payout management
- **Notification Module** - Multi-channel notifications (email, future: SMS)

### TypeORM Entity Loading - CRITICAL

**The application uses Webpack bundling (`nest-cli.json` has `"webpack": true`)**, which means glob patterns for entity loading don't work at runtime because all code is bundled into `dist/main.js`.

**Current implementation in `app.module.ts`:**
```typescript
import * as entities from './database/entities';

TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ...
    entities: Object.values(entities).filter(val =>
      typeof val === 'function' && val.prototype
    ),
  }),
})
```

**DO NOT change this back to glob patterns** like `[__dirname + '/**/*.entity{.ts,.js}']` - they will fail with Webpack.

The filter removes enums and other non-entity exports from the entities index file.

### FSM-Based Order Management

The Orders module implements Finite State Machines for three product types:

**Physical Items Flow:**
```
PENDING → PAYMENT_CONFIRMED → PREPARING → READY_TO_SHIP → SHIPPED → DELIVERED
         ↓                    ↓           ↓
         CANCELLED            CANCELLED   CANCELLED
```

**Digital Items Flow:**
```
PENDING → PAYMENT_CONFIRMED → ACCESS_GRANTED → DOWNLOADED
         ↓                    ↓
         CANCELLED            REFUND_REQUESTED → REFUNDED
```

**Service Items Flow:**
```
PENDING → PAYMENT_CONFIRMED → BOOKING_CONFIRMED → REMINDER_SENT → IN_PROGRESS → COMPLETED
         ↓                    ↓                   ↓                ↓
         CANCELLED            CANCELLED           CANCELLED        NO_SHOW
```

State transitions are validated by `OrderFSMService` and logged in `order_status_transitions` table for audit trail.

### Event-Driven Architecture

The system uses the **Outbox pattern** for reliable event publishing:

1. Business operations write events to `order_outbox` table in the same transaction
2. Background job (`OutboxService.processEvents()`) polls outbox and publishes events
3. Successfully published events are moved to `order_outbox_dlq` if they fail multiple times

Events include: `order.created`, `order.payment_confirmed`, `order.status_changed`, `line_item.status_changed`

### Path Aliases

TypeScript path aliases are configured in `tsconfig.json`:
```typescript
@/* → src/*
@modules/* → src/modules/*
@common/* → src/common/*
@config/* → src/config/*
@database/* → src/database/*
```

Always use these aliases for imports across the codebase.

### Authentication

- Global `JwtAuthGuard` is applied at app level (see `app.module.ts`)
- Controllers/routes can use `@Public()` decorator to bypass authentication
- User information available via `@CurrentUser()` decorator
- Passwords hashed with argon2 (more secure than bcrypt)

### Cart Module - Guest Session Management

**CRITICAL:** The cart system supports both authenticated users and guest users through session management.

**Backend Implementation:**
- Cart data is stored in Redis using keys: `cart:user:{userId}` or `cart:session:{sessionId}`
- All cart endpoints are marked as `@Public()` to allow guest access
- Session ID is read from `x-session-id` header (NOT from express-session)
- Controllers in `cart.controller.ts` use `@Headers('x-session-id')` to get session ID

**Frontend Implementation:**
- Session ID is generated once and stored in localStorage as `guest_session_id`
- Axios interceptor in `client/src/api/axios.config.ts` automatically adds `x-session-id` header to all requests
- Session ID persists across page reloads, ensuring cart continuity for guest users
- When user logs in, guest cart is merged with user cart via `/cart/merge` endpoint

**Important Files:**
- Backend: `src/modules/cart/cart.controller.ts`, `src/modules/cart/cart.service.ts`
- Frontend: `client/src/api/axios.config.ts` (session ID generation), `client/src/store/cartStore.ts`

## Frontend Architecture

The frontend is built with React 18, Vite, TypeScript, and Bootstrap 5. It uses Zustand for state management and React Router for navigation.

### Tech Stack

- **Build Tool:** Vite 5.x
- **Framework:** React 18 with TypeScript
- **UI Library:** React Bootstrap 5
- **State Management:** Zustand with persist middleware
- **Routing:** React Router v6
- **HTTP Client:** Axios with interceptors
- **Internationalization:** react-i18next (EN/RU/AR with RTL support)
- **Notifications:** react-hot-toast

### Zustand State Management - CRITICAL PATTERNS

**Atomic Selectors Pattern:**

Zustand selectors that return new objects on every render cause infinite re-render loops. **Always use atomic selectors** that return single primitive values or stable references.

**WRONG (causes infinite loops):**
```typescript
// ❌ Returns new object every time
export const useCartSummary = () =>
  useCartStore((state) => ({
    summary: state.summary,
    total: state.total,
    itemsCount: state.itemsCount,
  }));
```

**CORRECT (atomic selectors):**
```typescript
// ✅ Each selector returns a single value
export const useCartSummary = () => useCartStore((state) => state.summary);
export const useCartTotal = () => useCartStore((state) => state.total);
export const useCartItemsCount = () => useCartStore((state) => state.itemsCount);

// ✅ Functions are stable in zustand, safe to return directly
export const useLoadCart = () => useCartStore((state) => state.loadCart);
export const useUpdateQuantity = () => useCartStore((state) => state.updateQuantity);
```

**Usage in components:**
```typescript
// Instead of destructuring one hook
const { summary, total, itemsCount } = useCartSummary(); // ❌

// Use multiple atomic selectors
const summary = useCartSummary();   // ✅
const total = useCartTotal();       // ✅
const itemsCount = useCartItemsCount(); // ✅
```

**DO NOT use `shallow` comparison** - it doesn't solve the problem if you're creating new objects. Use atomic selectors instead.

### CSS and Layout

**Fixed Navbar Pattern:**

The navbar uses Bootstrap's `fixed="top"` which requires all page containers to have `padding-top: 80px` to prevent content from being hidden behind the navbar.

**All page-level CSS classes must include:**
```css
.my-page {
  padding-top: 80px; /* Account for fixed navbar */
  min-height: calc(100vh - 200px);
}
```

Pages that need this:
- CatalogPage, ProductPage, CartPage, CheckoutPage
- ProfilePage, OrdersPage, OrderDetailsPage
- WishlistPage, NotificationsPage, SearchPage
- All Merchant pages (DashboardPage, ProductsPage, etc.)

### EditorJS Content Handling

Product descriptions use EditorJS format. Use `extractTextFromEditorJS()` utility from `client/src/utils/editorjs.ts` to extract plain text for previews:

```typescript
import { extractTextFromEditorJS } from '@/utils/editorjs';

const preview = extractTextFromEditorJS(product.description, 150); // 150 char limit
```

## Docker Infrastructure

Default ports (can be changed in `docker-compose.yml` and `.env`):
- PostgreSQL: 5432 (or 5433 to avoid conflicts)
- Redis: 6379 (or 6380 to avoid conflicts)
- LocalStack (S3/SQS): 4566
- Adminer (DB UI): 8080 (or 8081 to avoid conflicts)

Access Adminer at `http://localhost:8080`:
- System: PostgreSQL
- Server: postgres
- Username: snailmarket
- Password: snailmarket_password
- Database: snailmarket

## Testing Infrastructure

### Test Database Setup
```bash
# Create test database
createdb snailmarket_test

# Set up test environment
cp .env.test.example .env.test

# Run migrations for test database
NODE_ENV=test npm run migration:run
```

### Test Utilities

**Location:** `test/utils/`

- `test-db.ts` - Database connection and cleanup utilities
- `test-helpers.ts` - Helper functions for creating test data:
  - `createTestUser()` - Create user with hashed password
  - `createTestMerchant()` - Create merchant profile
  - `createTestProduct()` - Create product
  - `createTestCheckoutSession()` - Create checkout session
  - `createTestOrder()` - Create order with line items
  - `createTestLineItem()` - Create order line item

**Test Fixtures:** `test/fixtures/` - Pre-defined test data for consistent testing

**Mocks:** `test/mocks/` - Mock repositories and services

### Test Patterns

```typescript
// Unit test with mocked repository
const mockRepo = createMockRepository();
await Test.createTestingModule({
  providers: [
    MyService,
    { provide: getRepositoryToken(MyEntity), useValue: mockRepo }
  ]
}).compile();

// Integration test with real database
const dataSource = await startTestDb();
const user = await createTestUser(dataSource, {
  email: 'test@example.com',
  password: 'test123'
});
await cleanupTestDb(dataSource);
```

## Common Development Patterns

### Creating a New Module

```bash
# Generate module scaffold
nest generate module modules/my-module
nest generate controller modules/my-module
nest generate service modules/my-module
```

Then:
1. Create entity in `src/database/entities/my-entity.entity.ts`
2. Export entity from `src/database/entities/index.ts`
3. Create migration: `npm run migration:generate -- src/database/migrations/CreateMyEntity`
4. Run migration: `npm run migration:run`
5. Register `TypeOrmModule.forFeature([MyEntity])` in module
6. Import module in `app.module.ts`

### Database Transactions

Use TypeORM QueryRunner for transactions:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(entity1);
  await queryRunner.manager.save(entity2);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

### Validation

Use class-validator decorators on DTOs:

```typescript
export class CreateOrderDto {
  @IsUUID()
  checkout_session_id: string;

  @IsOptional()
  @IsString()
  payment_intent_id?: string;
}
```

## CI/CD Pipeline

The project uses GitHub Actions with three main workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Triggers on push to feature branches and PRs to develop
   - Runs: lint, type check, unit tests, integration tests, security scan
   - Minimum coverage: 80%

2. **Staging Deployment** (`.github/workflows/deploy-staging.yml`)
   - Auto-deploys on merge to `develop`
   - Runs E2E tests after deployment

3. **Production Deployment** (`.github/workflows/deploy-production.yml`)
   - Requires manual approval on merge to `main`
   - Blue-green deployment with automatic rollback

See `.github/SETUP.md` for detailed CI/CD configuration instructions.

## Important Configuration Files

- `nest-cli.json` - **Has Webpack enabled**, affects entity loading
- `tsconfig.json` - Path aliases and TypeScript config
- `src/database/data-source.ts` - TypeORM data source for migrations (uses glob patterns, only runs outside Webpack)
- `app.module.ts` - Root module with explicit entity imports (required for Webpack)
- `docker-compose.yml` - Infrastructure services
- `.env` - Environment configuration (never commit this file)

## Common Pitfalls

1. **Entity not found errors** - Ensure entity is exported from `src/database/entities/index.ts`
2. **Migration issues** - Always use `npm run migration:generate`, not manual creation
3. **Docker port conflicts** - Check if ports are already in use, change in `docker-compose.yml` and `.env`
4. **Test database not created** - Run `createdb snailmarket_test` before running tests
5. **Webpack vs ts-node** - Remember entity loading differs between `app.module.ts` (Webpack) and `data-source.ts` (ts-node)

## API Documentation

- Swagger UI: `http://localhost:3000/api/docs` (when implemented)
- Health check: `GET /health`
- API base: `http://localhost:3000/api/v1`

Each module exposes an info endpoint: `GET /api/v1/{module}/info`

## Code Review Checklist

When reviewing or writing code:
- [ ] Tests written (>80% coverage target)
- [ ] Error handling implemented
- [ ] Validation on DTOs
- [ ] Database transactions used where needed
- [ ] Events emitted for state changes (when using FSM)
- [ ] Path aliases used for imports
- [ ] No sensitive data in logs
- [ ] Migration reversible where possible
- [ ] TypeScript strict mode compliance
