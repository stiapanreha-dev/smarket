# Testing Infrastructure

Test patterns and utilities for unit, integration, and E2E testing.

## Test Database Setup

```bash
# Create test database
createdb snailmarket_test

# Set up test environment
cp .env.test.example .env.test

# Run migrations for test database
NODE_ENV=test npm run migration:run
```

## Test Utilities

**Location:** `test/utils/`

### Database Utilities (`test-db.ts`)
- `startTestDb()` - Initialize test database connection
- `cleanupTestDb()` - Clean up after tests

### Test Helpers (`test-helpers.ts`)
```typescript
// Create test data
await createTestUser(dataSource, {
  email: 'test@example.com',
  password: 'test123',
});

await createTestMerchant(dataSource, { user_id: userId });

await createTestProduct(dataSource, {
  name: 'Test Product',
  price: 99.99,
  merchant_id: merchantId,
});

await createTestOrder(dataSource, {
  customer_id: userId,
  total: 99.99,
});

await createTestLineItem(dataSource, {
  order_id: orderId,
  product_id: productId,
});
```

## Test Patterns

### Unit Tests (with mocked repository)

```typescript
describe('OrderService', () => {
  let service: OrderService;
  let mockRepo: MockRepository<Order>;

  beforeEach(async () => {
    mockRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: getRepositoryToken(Order), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should create order', async () => {
    mockRepo.save.mockResolvedValue(mockOrder);
    const result = await service.createOrder(dto);
    expect(result).toEqual(mockOrder);
  });
});
```

### Integration Tests (with real database)

```typescript
describe('OrderService Integration', () => {
  let dataSource: DataSource;
  let service: OrderService;

  beforeAll(async () => {
    dataSource = await startTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb(dataSource);
  });

  it('should create order with line items', async () => {
    const user = await createTestUser(dataSource, {
      email: 'test@example.com',
    });

    const order = await service.createOrder({
      customer_id: user.id,
      items: [{ product_id: productId, quantity: 2 }],
    });

    expect(order.line_items).toHaveLength(1);
  });
});
```

### E2E Tests

```typescript
describe('Orders E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /orders creates order', () => {
    return request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ checkout_session_id: sessionId })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.status).toBe('PENDING');
      });
  });
});
```

## Test Fixtures

**Location:** `test/fixtures/`

Pre-defined test data for consistent testing:
```typescript
export const testProduct = {
  name: 'Test Product',
  price: 99.99,
  product_type: ProductType.PHYSICAL,
};

export const testUser = {
  email: 'test@example.com',
  password: 'test123',
};
```

## Mock Repositories

**Location:** `test/mocks/`

```typescript
export const createMockRepository = <T>(): MockRepository<T> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
});
```

## Coverage Target

- Minimum coverage: **80%**
- Check coverage: `npm run test:cov`

## Testing Best Practices

1. **Unit tests** - Test service logic with mocked dependencies
2. **Integration tests** - Test with real database for complex flows
3. **E2E tests** - Test API endpoints end-to-end
4. **Use test helpers** - Consistent test data creation
5. **Clean up** - Always clean database after tests
6. **Mock external services** - Payment providers, email, S3

## Related

- See `test/README.md` for detailed testing documentation
- See `development/commands.md` for test commands
