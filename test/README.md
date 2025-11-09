# Testing Strategy

This directory contains the comprehensive testing infrastructure for the SnailMarketplace application.

## Directory Structure

```
test/
├── fixtures/          # Test data fixtures
│   ├── users.fixture.ts
│   ├── products.fixture.ts
│   ├── orders.fixture.ts
│   └── checkout.fixture.ts
├── mocks/            # Mock implementations
│   ├── stripe.mock.ts
│   ├── repository.mock.ts
│   └── services.mock.ts
├── utils/            # Test utilities
│   ├── test-db.ts
│   ├── seed-test-data.ts
│   └── test-helpers.ts
├── integration/      # Integration tests
│   └── order.controller.spec.ts
├── e2e/             # End-to-end tests
│   └── checkout-flow.e2e-spec.ts
├── setup.ts         # Global test setup
└── jest-e2e.json    # E2E test configuration
```

## Test Levels

### 1. Unit Tests (Target Coverage: >80%)

Unit tests focus on individual functions, services, and business logic in isolation.

**Location**: `src/**/*.spec.ts`

**Run**: `npm test`

**Examples**:
- `src/modules/orders/services/order.service.spec.ts`
- `src/modules/payment/services/payment.service.spec.ts`

**What to test**:
- Services: business logic, error handling, state transitions
- Repositories: query building, data transformation
- Validators: input validation logic
- Transformers: data mapping and transformation

### 2. Integration Tests (Target Coverage: >70%)

Integration tests verify that multiple components work together correctly, including database operations.

**Location**: `test/integration/**/*.spec.ts`

**Run**: `npm test -- --testPathPattern=integration`

**Examples**:
- `test/integration/order.controller.spec.ts`

**What to test**:
- API endpoints with real database
- Service layer integration
- Database operations
- Authentication & authorization

### 3. E2E Tests (Target Coverage: >50% of critical paths)

End-to-end tests verify complete user journeys through the application.

**Location**: `test/e2e/**/*.e2e-spec.ts`

**Run**: `npm run test:e2e`

**Examples**:
- `test/e2e/checkout-flow.e2e-spec.ts`

**What to test**:
- Complete checkout flow
- Payment processing
- Order fulfillment
- User registration and authentication
- Critical business workflows

## Running Tests

### Run all unit tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:cov
```

### Run E2E tests
```bash
npm run test:e2e
```

### Run specific test file
```bash
npm test -- order.service.spec.ts
```

### Run tests matching pattern
```bash
npm test -- --testPathPattern=payment
```

## Test Database Setup

Tests use a separate test database to avoid affecting development data.

### Environment Variables

Create a `.env.test` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=snailmarket
DB_PASSWORD=snailmarket_password
DB_DATABASE=snailmarket_test
NODE_ENV=test
```

### Database Lifecycle

1. **Before All Tests**: Database is initialized and migrations are run
2. **Before Each Test**: Tables are truncated and test data is seeded
3. **After All Tests**: Database connections are closed

### Manual Database Setup

```bash
# Create test database
createdb snailmarket_test

# Run migrations
NODE_ENV=test npm run migration:run

# Seed test data (optional)
NODE_ENV=test npm run seed
```

## Writing Tests

### Unit Test Example

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { createMockRepository } from '../../../test/mocks/repository.mock';

describe('OrderService', () => {
  let service: OrderService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: repository },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should create order successfully', async () => {
    // Arrange
    const mockOrder = { id: 'order-1', status: 'pending' };
    repository.save.mockResolvedValue(mockOrder);

    // Act
    const result = await service.createOrder(orderData);

    // Assert
    expect(result).toEqual(mockOrder);
    expect(repository.save).toHaveBeenCalled();
  });
});
```

### Integration Test Example

```typescript
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('Orders API (Integration)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeEach(async () => {
    // Setup app and auth
  });

  it('POST /api/v1/orders', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ checkout_session_id: sessionId })
      .expect(201);

    expect(response.body.data).toMatchObject({
      id: expect.any(String),
      status: 'pending',
    });
  });
});
```

### E2E Test Example

```typescript
describe('Complete Checkout Flow (E2E)', () => {
  it('should complete purchase end-to-end', async () => {
    // 1. Add to cart
    await request(app).post('/api/v1/cart/items').send(cartItem);

    // 2. Create checkout
    const checkout = await request(app).post('/api/v1/checkout/sessions');

    // 3. Add shipping
    await request(app).put(`/api/v1/checkout/sessions/${checkout.id}/shipping`);

    // 4. Create order
    const order = await request(app).post('/api/v1/orders');

    // 5. Authorize payment
    const payment = await request(app).post('/api/v1/payments/authorize');

    // 6. Simulate webhook
    await request(app).post('/api/v1/webhooks/stripe').send(webhookPayload);

    // 7. Verify order status
    const finalOrder = await request(app).get(`/api/v1/orders/${order.id}`);
    expect(finalOrder.body.data.status).toBe('confirmed');
  });
});
```

## Fixtures and Mocks

### Using Fixtures

```typescript
import { testUsers, testAddresses } from '../fixtures/users.fixture';
import { testProducts } from '../fixtures/products.fixture';

const user = testUsers.buyer;
const address = testAddresses.usAddress;
```

### Using Mocks

```typescript
import { createMockStripeProvider } from '../mocks/stripe.mock';
import { createMockRepository } from '../mocks/repository.mock';

const stripeProvider = createMockStripeProvider();
stripeProvider.createPaymentIntent.mockResolvedValue({ id: 'pi_123' });
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory.

### View HTML Report

```bash
npm run test:cov
open coverage/lcov-report/index.html
```

### Coverage Thresholds

- **Unit Tests**: 80% (branches, functions, lines, statements)
- **Integration Tests**: 70%
- **E2E Tests**: 50% of critical paths

## Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (when possible)
3. **Clear test names**: `should [expected behavior] when [condition]`
4. **Mock external dependencies**: databases, APIs, file system
5. **Test edge cases**: null values, empty arrays, errors
6. **Keep tests independent**: no shared state between tests
7. **Use factories**: for creating test data consistently
8. **Clean up**: remove test data after tests

## Debugging Tests

### Debug single test
```bash
npm run test:debug -- order.service.spec.ts
```

### VS Code Debug Configuration

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment

### GitHub Actions Workflow

```yaml
- name: Run tests
  run: npm run test:cov

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Troubleshooting

### Tests timeout
- Increase timeout: `jest.setTimeout(60000)`
- Check for unclosed connections
- Use `--detectOpenHandles`

### Database connection issues
- Verify test database exists
- Check `.env.test` configuration
- Ensure migrations are run

### Random test failures
- Check for shared state
- Use `--runInBand` to run serially
- Verify test data cleanup

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing NestJS](https://docs.nestjs.com/fundamentals/testing)
- [Supertest](https://github.com/visionmedia/supertest)
