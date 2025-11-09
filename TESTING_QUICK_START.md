# Testing Quick Start Guide

## Setup (One-time)

### 1. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 2. Create Test Database
```bash
# Create PostgreSQL test database
createdb snailmarket_test

# Or using psql
psql -U postgres -c "CREATE DATABASE snailmarket_test;"
```

### 3. Configure Test Environment
```bash
# Copy example env file
cp .env.test.example .env.test

# Edit .env.test with your database credentials
# DB_HOST=localhost
# DB_PORT=5432
# DB_USERNAME=snailmarket
# DB_PASSWORD=snailmarket_password
# DB_DATABASE=snailmarket_test
```

### 4. Run Migrations
```bash
NODE_ENV=test npm run migration:run
```

## Running Tests

### Quick Test Commands

```bash
# Run all unit tests
npm test

# Run all unit tests with coverage
npm run test:cov

# Run tests in watch mode (for development)
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test order.service.spec.ts

# Run tests matching pattern
npm test -- --testPathPattern=payment
```

## Viewing Coverage

```bash
# Generate coverage report
npm run test:cov

# Open HTML coverage report (macOS)
open coverage/lcov-report/index.html

# Open HTML coverage report (Linux)
xdg-open coverage/lcov-report/index.html

# Open HTML coverage report (Windows)
start coverage/lcov-report/index.html
```

## Writing Your First Test

### 1. Create Test File
Create a file next to your service: `my-service.spec.ts`

### 2. Basic Structure
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my-service';

describe('MyService', () => {
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MyService],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should do something', async () => {
    // Arrange
    const input = 'test';

    // Act
    const result = await service.doSomething(input);

    // Assert
    expect(result).toBe('expected output');
  });
});
```

### 3. Using Mocks
```typescript
import { createMockRepository } from '../../../test/mocks/repository.mock';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MyEntity } from './my.entity';

describe('MyService', () => {
  let service: MyService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: getRepositoryToken(MyEntity),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
  });

  it('should find entity', async () => {
    const mockEntity = { id: '1', name: 'Test' };
    repository.findOne.mockResolvedValue(mockEntity);

    const result = await service.findById('1');

    expect(result).toEqual(mockEntity);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: '1' },
    });
  });
});
```

### 4. Using Fixtures
```typescript
import { testUsers } from '../../../test/fixtures/users.fixture';

it('should create user', async () => {
  const userData = testUsers.buyer;
  // Use the fixture data in your test
});
```

## Common Test Patterns

### Testing Success Case
```typescript
it('should create order successfully', async () => {
  // Arrange
  const orderData = { ... };
  repository.save.mockResolvedValue({ id: '1', ...orderData });

  // Act
  const result = await service.createOrder(orderData);

  // Assert
  expect(result).toMatchObject(orderData);
  expect(repository.save).toHaveBeenCalled();
});
```

### Testing Error Case
```typescript
it('should throw NotFoundException when order not found', async () => {
  // Arrange
  repository.findOne.mockResolvedValue(null);

  // Act & Assert
  await expect(service.getOrder('invalid-id'))
    .rejects.toThrow(NotFoundException);
});
```

### Testing with Database (Integration)
```typescript
import { getTestDataSource } from '../../../test/setup';
import { createTestUser } from '../../../test/utils/test-helpers';

describe('UserService (Integration)', () => {
  let dataSource: DataSource;

  beforeAll(() => {
    dataSource = getTestDataSource();
  });

  it('should create user in database', async () => {
    const user = await createTestUser(dataSource, {
      email: 'test@example.com',
      password: 'password123',
    });

    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');

    // Verify in database
    const found = await dataSource
      .query('SELECT * FROM users WHERE id = $1', [user.id]);
    expect(found).toHaveLength(1);
  });
});
```

## Debugging Tests

### Run Single Test with Debug
```bash
npm run test:debug -- my-service.spec.ts
```

### Use VS Code Debugger
1. Set breakpoint in test file
2. Press F5 or use "Debug" menu
3. Select "Jest Debug" configuration

### Check for Open Handles
```bash
npm test -- --detectOpenHandles
```

## Troubleshooting

### Tests Timeout
```typescript
// Increase timeout for specific test
it('long running test', async () => {
  // Test code
}, 60000); // 60 seconds

// Or globally in jest.config.js
testTimeout: 30000
```

### Database Connection Issues
```bash
# Check if test database exists
psql -l | grep snailmarket_test

# Verify .env.test configuration
cat .env.test

# Run migrations
NODE_ENV=test npm run migration:run
```

### Mock Not Working
```typescript
// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

// Reset mock implementation
beforeEach(() => {
  mockService.method.mockReset();
  mockService.method.mockResolvedValue(defaultValue);
});
```

## CI/CD

Tests automatically run on:
- Every push to `main` or `develop`
- Every pull request
- Before deployment

View test results:
- GitHub Actions tab
- PR checks
- Coverage reports on Codecov

## Best Practices Checklist

- [ ] Test file named `*.spec.ts`
- [ ] Test describes what it tests
- [ ] Uses AAA pattern (Arrange, Act, Assert)
- [ ] Mocks external dependencies
- [ ] Tests both success and error cases
- [ ] No shared state between tests
- [ ] Fast execution (< 1 second per test)
- [ ] Clear assertion messages
- [ ] Uses fixtures for test data
- [ ] Cleans up after test

## Next Steps

1. **Read** `test/README.md` for detailed documentation
2. **Review** existing tests in `src/**/*.spec.ts`
3. **Run** tests to familiarize yourself
4. **Write** tests for new features
5. **Maintain** >80% coverage

## Resources

- **Test Documentation**: `test/README.md`
- **Implementation Summary**: `TESTING_SUMMARY.md`
- **Fixtures**: `test/fixtures/`
- **Mocks**: `test/mocks/`
- **Examples**: `src/**/*.spec.ts`

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests |
| `npm run test:cov` | Run with coverage |
| `npm run test:watch` | Watch mode |
| `npm run test:e2e` | E2E tests |
| `npm run test:debug` | Debug mode |

## Getting Help

- Check `test/README.md` for detailed docs
- Review existing tests for patterns
- Ask team for code review
- Consult Jest documentation

---

**Happy Testing! 🧪**
