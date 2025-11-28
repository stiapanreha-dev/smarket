# Code Style Guide

This guide defines coding standards and patterns for SnailMarketplace. Follow these patterns to ensure consistency, prevent bugs, and maintain code quality.

---

## 1. Core Principles

### TypeScript Strict Mode
- **No `any` type** - Use proper typing or `unknown` with type guards
- Enable strict mode in `tsconfig.json`
- Prefer interfaces over types for object shapes

### Path Aliases (REQUIRED)
Always use path aliases configured in `tsconfig.json`:

```typescript
// ✅ CORRECT
import { CartService } from '@modules/cart/cart.service';
import { User } from '@database/entities';
import { JwtAuthGuard } from '@common/guards';

// ❌ WRONG - Never use relative paths
import { CartService } from '../../../cart/cart.service';
import { User } from '../../../../database/entities/user.entity';
```

**Available aliases:**
- `@/*` → `src/*`
- `@modules/*` → `src/modules/*`
- `@common/*` → `src/common/*`
- `@config/*` → `src/config/*`
- `@database/*` → `src/database/*`

### No Code Duplication
- Extract shared logic into services or utilities
- Use composition over inheritance
- Create reusable DTOs and interfaces

---

## 2. Backend Patterns

### 2.1 Service Pattern

Every service follows this structure:

```typescript
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// Constants at top of file
const SESSION_TTL_MINUTES = 60;
const MAX_ITEMS = 50;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(CheckoutSession)
    private readonly checkoutSessionRepository: Repository<CheckoutSession>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
  ) {}

  async createSession(userId: string, dto: CreateSessionDto): Promise<CheckoutSession> {
    // 1. Validation first
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // 2. Business logic
    const session = this.checkoutSessionRepository.create({
      user_id: userId,
      ...dto,
    });

    const saved = await this.checkoutSessionRepository.save(session);

    // 3. Logging
    this.logger.log(`Created checkout session ${saved.id}`);

    return saved;
  }
}
```

**Key points:**
- `@Injectable()` decorator
- Private `Logger` with service name
- Repository injection via `@InjectRepository()`
- Constants defined at file top
- Validation → Business logic → Logging order

### 2.2 Transaction Pattern

Use TypeORM's QueryRunner for multi-step operations:

```typescript
async executeCheckoutSaga(session: CheckoutSession): Promise<CheckoutSession> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Step 1: Update session
    session.step = CheckoutStep.PAYMENT;
    await queryRunner.manager.save(session);

    // Step 2: Create order (may use its own transaction)
    const order = await this.orderService.createOrderFromCheckout(session.id);
    session.order_id = order.id;

    // Step 3: Commit inventory
    await this.inventoryService.commitReservation(session.id);

    // Step 4: Complete
    session.status = CheckoutStatus.COMPLETED;
    await queryRunner.manager.save(session);
    await queryRunner.commitTransaction();

    this.logger.log(`Checkout completed: ${session.id}`);
    return session;

  } catch (error) {
    await queryRunner.rollbackTransaction();

    // Cleanup on failure
    session.status = CheckoutStatus.FAILED;
    session.error_message = error.message;
    await this.checkoutSessionRepository.save(session);

    // Release resources (don't fail if cleanup fails)
    await this.inventoryService.releaseReservation(session.id)
      .catch(err => this.logger.error('Cleanup failed', err));

    this.logger.error(`Checkout failed: ${session.id}`, error);
    throw new BadRequestException(`Checkout failed: ${error.message}`);

  } finally {
    await queryRunner.release();
  }
}
```

**Key points:**
- Always `release()` in `finally`
- Rollback before cleanup
- Non-critical cleanup with `.catch()` logging
- Log both success and failure

### 2.3 DTO Validation

All DTOs must have validation decorators:

```typescript
import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 1,
    minimum: 1,
    maximum: 99,
  })
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Product variant ID',
  })
  @IsOptional()
  @IsUUID()
  variantId?: string;
}
```

**Key points:**
- `@ApiProperty` for Swagger docs
- Validation decorators from `class-validator`
- `@IsOptional()` for optional fields
- Range validation with `@Min()`, `@Max()`

### 2.4 Entity Pattern (CRITICAL)

**All entities MUST be exported from `src/database/entities/index.ts`:**

```typescript
// src/database/entities/index.ts
export { User } from './user.entity';
export { Order } from './order.entity';
export { OrderLineItem } from './order-line-item.entity';
export { CheckoutSession } from './checkout-session.entity';
// Add ALL new entities here!
```

**Why:** Webpack bundling is enabled (`nest-cli.json` has `"webpack": true`). Glob patterns don't work at runtime.

**Entity structure:**

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { IsString, IsUUID, IsEnum, IsOptional } from 'class-validator';

// Enums OUTSIDE the entity class
export enum OrderStatus {
  PENDING = 'pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
@Index(['user_id', 'status'])
@Index(['order_number'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  order_number: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  user_id: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => OrderLineItem, (item) => item.order)
  line_items: OrderLineItem[];
}
```

**Key points:**
- Enums defined outside entity class
- `@Index` on frequently queried columns
- `@CreateDateColumn` / `@UpdateDateColumn` for timestamps
- `@JoinColumn` with explicit column name
- Nullable relations typed as `Type | null`

### 2.5 Controller Pattern

```typescript
import { Controller, Get, Post, Body, Param, Headers, Request, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Public } from '@modules/auth/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '@modules/auth/guards/optional-jwt-auth.guard';

@Controller('checkout')
export class CheckoutController {
  private readonly logger = new Logger(CheckoutController.name);

  constructor(private readonly checkoutService: CheckoutService) {}

  /**
   * POST /api/v1/checkout/sessions
   * Create a new checkout session
   */
  @Public()
  @Post('sessions')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Request() req: any,
    @Headers('x-session-id') sessionId: string,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSession> {
    const userId = req.user?.userId;

    this.logger.log(`Creating session for ${userId ? `user ${userId}` : 'guest'}`);

    return this.checkoutService.createSession(userId, {
      ...dto,
      sessionId: sessionId || dto.sessionId,
    });
  }

  /**
   * GET /api/v1/checkout/sessions/:id
   */
  @Public()
  @Get('sessions/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getSession(
    @Request() req: any,
    @Param('id') sessionId: string,
  ): Promise<CheckoutSession> {
    return this.checkoutService.getSession(sessionId, req.user?.userId);
  }
}
```

**Key points:**
- `@Public()` decorator for endpoints that don't require auth
- `@UseGuards(OptionalJwtAuthGuard)` for guest + auth support
- JSDoc comments for each endpoint
- Extract user from `req.user?.userId`
- Logger for request tracing

### 2.6 FSM Rule (CRITICAL)

**NEVER update order/item status directly:**

```typescript
// ❌ WRONG - Bypasses FSM validation and logging
order.status = OrderStatus.SHIPPED;
await this.orderRepository.save(order);

// ✅ CORRECT - Use FSM service
await this.orderFSMService.transition(order, OrderStatus.SHIPPED, {
  actor_id: userId,
  notes: 'Shipped via FedEx',
});
```

FSM ensures:
- Valid state transitions only
- Audit trail in `order_status_transitions` table
- Outbox events for downstream systems

---

## 3. Frontend Patterns

### 3.1 Zustand Atomic Selectors (CRITICAL)

**This is the most important frontend pattern. Violations cause infinite re-render loops.**

```typescript
// Store definition
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      summary: null,
      total: 0,
      itemsCount: 0,
      isLoading: false,
      error: null,

      // Actions
      loadCart: async () => { /* ... */ },
      addItem: async (dto) => { /* ... */ },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.total,
      }),
    }
  )
);

// ✅ CORRECT - Atomic selectors (one value each)
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartSummary = () => useCartStore((state) => state.summary);
export const useCartTotal = () => useCartStore((state) => state.total);
export const useCartItemsCount = () => useCartStore((state) => state.itemsCount);
export const useCartLoading = () => useCartStore((state) => state.isLoading);
export const useCartError = () => useCartStore((state) => state.error);

// Action hooks (functions are stable references)
export const useLoadCart = () => useCartStore((state) => state.loadCart);
export const useAddToCart = () => useCartStore((state) => state.addItem);
```

```typescript
// ❌ WRONG - Returns new object every render → INFINITE LOOP
export const useCartSummary = () =>
  useCartStore((state) => ({
    summary: state.summary,
    total: state.total,
    itemsCount: state.itemsCount,
  }));

// ❌ WRONG - Destructuring from object selector
const { summary, total } = useCartSummary(); // CRASHES APP
```

**Why:** Each render creates a new object `{}`, which Zustand sees as "changed", triggering re-render, creating new object, infinite loop.

### 3.2 Store Action Pattern

All async actions follow this structure:

```typescript
loadCart: async () => {
  try {
    // 1. Set loading state first
    set({ isLoading: true, error: null });

    // 2. API call
    const response = await cartApi.getCart();

    // 3. Transform data
    const items = response.cart.items.map(item =>
      toCartItemWithProduct(item, item.product)
    );

    // 4. Single atomic state update
    set({
      cart: response.cart,
      items,
      summary: response.summary,
      total: response.summary.total,
      itemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
      isLoading: false,
      error: null,
    });

  } catch (error) {
    // 5. Handle error
    const errorMessage = error instanceof Error
      ? error.message
      : 'Failed to load cart';

    set({
      isLoading: false,
      error: errorMessage,
    });

    // 6. Re-throw for component error handling
    throw error;
  }
},
```

**Key points:**
- Set `isLoading: true` and clear error first
- Single `set()` call with all state updates
- Proper error message extraction
- Throw after setting error state

### 3.3 Component Integration

```typescript
const CartPage = () => {
  // ✅ CORRECT - Use atomic selector hooks
  const items = useCartItems();
  const total = useCartTotal();
  const isLoading = useCartLoading();
  const error = useCartError();

  // Action hooks
  const loadCart = useLoadCart();
  const removeItem = useRemoveCartItem();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  if (isLoading) return <Spinner />;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          onRemove={() => removeItem(item.id)}
        />
      ))}
      <div>Total: ${total}</div>
    </div>
  );
};
```

```typescript
// ❌ WRONG - Direct store access with destructuring
const CartPage = () => {
  const { items, total, isLoading } = useCartStore(); // WRONG!
  // ...
};
```

### 3.4 Common Components

#### DatePicker Component

Use the shared `DatePicker` component instead of native date inputs for consistent styling across the application.

**Location:** `client/src/components/common/DatePicker.tsx`

**Pattern:**

```typescript
import { DatePicker } from '@/components/common/DatePicker';

const MyForm = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  return (
    <Form>
      <DatePicker
        label="Select Date"
        selected={selectedDate}
        onChange={setSelectedDate}
        placeholder="dd.mm.yyyy"
        dateFormat="dd.MM.yyyy"
        required
        minDate={new Date()}
        isClearable
      />
    </Form>
  );
};
```

**Props:**

```typescript
interface DatePickerProps {
  selected: Date | null;           // Current selected date
  onChange: (date: Date | null) => void;  // Change handler
  label?: string;                   // Input label
  placeholder?: string;             // Placeholder text
  error?: string;                   // Error message
  required?: boolean;               // Is required field
  dateFormat?: string;              // Date format (default: 'dd.MM.yyyy')
  minDate?: Date;                   // Minimum selectable date
  maxDate?: Date;                   // Maximum selectable date
  disabled?: boolean;               // Disabled state
  showTimeSelect?: boolean;         // Show time picker
  isClearable?: boolean;            // Allow clearing selection (default: true)
  className?: string;               // Additional input className
  containerClassName?: string;      // Container className
}
```

**Key features:**
- Uses `react-datepicker` with Bootstrap styling
- Consistent form styling with `form-control` class
- Error validation display
- Required field indicator
- Clearable by default
- Customizable date format (default: dd.MM.yyyy)

**Why use this instead of native `<input type="date">`:**
1. **Consistent styling** - Native date inputs look different across browsers
2. **Better UX** - Calendar picker is more intuitive than typing dates
3. **Format control** - Consistent date format across application
4. **Validation** - Built-in min/max date validation
5. **Bootstrap integration** - Matches form styling

**Anti-pattern:**

```typescript
// ❌ WRONG - Native date input (inconsistent styling)
<Form.Control
  type="date"
  value={dateValue}
  onChange={(e) => setDateValue(e.target.value)}
/>

// ✅ CORRECT - Use DatePicker component
<DatePicker
  selected={dateValue}
  onChange={setDateValue}
  dateFormat="dd.MM.yyyy"
/>
```

---

## 4. Testing Patterns

### Backend Unit Tests

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let checkoutSessionRepository: jest.Mocked<Repository<CheckoutSession>>;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockCartService = {
    getCart: jest.fn(),
    clearCart: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: { save: jest.fn() },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        {
          provide: getRepositoryToken(CheckoutSession),
          useValue: mockRepository,
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  describe('createSession', () => {
    it('should create checkout session successfully', async () => {
      // Arrange
      const mockCart = { items: [{ productId: '123', quantity: 1 }] };
      mockCartService.getCart.mockResolvedValue(mockCart);
      mockRepository.create.mockReturnValue({ id: 'session-1' });
      mockRepository.save.mockResolvedValue({ id: 'session-1', status: 'active' });

      // Act
      const result = await service.createSession('user-1', { sessionId: 'guest-123' });

      // Assert
      expect(result.id).toBe('session-1');
      expect(mockCartService.getCart).toHaveBeenCalledWith('user-1', 'guest-123');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should throw error if cart is empty', async () => {
      mockCartService.getCart.mockResolvedValue({ items: [] });

      await expect(service.createSession('user-1', {}))
        .rejects
        .toThrow('Cart is empty');
    });
  });
});
```

### Frontend Tests (Vitest)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock stores
vi.mock('@/store/cartStore');

describe('CartPage', () => {
  const mockLoadCart = vi.fn();
  const mockRemoveItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useCartItems).mockReturnValue([
      { id: '1', productName: 'Test Product', quantity: 2, price: 100 },
    ]);
    vi.mocked(useCartTotal).mockReturnValue(200);
    vi.mocked(useCartLoading).mockReturnValue(false);
    vi.mocked(useLoadCart).mockReturnValue(mockLoadCart);
  });

  it('should render cart items', () => {
    render(<CartPage />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$200')).toBeInTheDocument();
  });

  it('should call loadCart on mount', async () => {
    render(<CartPage />);

    await waitFor(() => {
      expect(mockLoadCart).toHaveBeenCalled();
    });
  });
});
```

---

## 5. Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Services** | `{Entity}Service` | `CartService`, `CheckoutService` |
| **Controllers** | `{Entity}Controller` | `CheckoutController` |
| **DTOs** | `{Action}{Entity}Dto` | `CreateOrderDto`, `UpdateShippingAddressDto` |
| **Entities** | `PascalCase` | `Order`, `OrderLineItem` |
| **Enums** | `PascalCase` | `OrderStatus`, `CheckoutStep` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `SESSION_TTL_MINUTES`, `MAX_ITEMS` |
| **Methods** | `camelCase` | `createSession`, `getDeliveryOptions` |
| **DB columns** | `snake_case` | `user_id`, `created_at`, `order_number` |
| **Zustand stores** | `use{Name}Store` | `useCartStore`, `useAuthStore` |
| **Selectors** | `use{Value}` | `useCartItems`, `useCartTotal` |
| **Components** | `PascalCase` | `ProductCard`, `CheckoutForm` |
| **Props interfaces** | `{Component}Props` | `ProductCardProps` |

---

## 6. Anti-patterns (NEVER DO)

### Entity Loading with Globs

```typescript
// ❌ WRONG - Doesn't work with Webpack bundling
// In app.module.ts
entities: [__dirname + '/**/*.entity{.ts,.js}']

// ✅ CORRECT - Explicit imports
import * as entities from './database/entities';
entities: Object.values(entities).filter(val =>
  typeof val === 'function' && val.prototype
),
```

### Object Returns from Zustand

```typescript
// ❌ WRONG - Causes infinite re-render loop
export const useCartData = () =>
  useCartStore((state) => ({
    items: state.items,
    total: state.total,
  }));

// ✅ CORRECT - Atomic selectors
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartTotal = () => useCartStore((state) => state.total);
```

### Relative Imports

```typescript
// ❌ WRONG
import { CartService } from '../../../cart/cart.service';

// ✅ CORRECT
import { CartService } from '@modules/cart/cart.service';
```

### Direct Status Updates

```typescript
// ❌ WRONG - Bypasses FSM
order.status = OrderStatus.SHIPPED;
await this.orderRepository.save(order);

// ✅ CORRECT
await this.orderFSMService.transition(order, OrderStatus.SHIPPED, { actor_id });
```

### Missing Error Handling

```typescript
// ❌ WRONG - Unhandled promise
this.sendEmail(user.email);

// ✅ CORRECT
this.sendEmail(user.email).catch(err =>
  this.logger.error('Email failed', err)
);
```

### No Logging

```typescript
// ❌ WRONG - No visibility
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepository.save(orderData);
  return order;
}

// ✅ CORRECT
async createOrder(dto: CreateOrderDto) {
  const order = await this.orderRepository.save(orderData);
  this.logger.log(`Order created: ${order.order_number}`);
  return order;
}
```

### Missing DTO Validation

```typescript
// ❌ WRONG - No validation
export class CreateOrderDto {
  userId: string;
  amount: number;
}

// ✅ CORRECT
export class CreateOrderDto {
  @IsUUID()
  userId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
```

### Using Native Date Inputs

```typescript
// ❌ WRONG - Inconsistent styling across browsers
<Form.Control
  type="date"
  value={dateValue}
  onChange={(e) => setDateValue(e.target.value)}
/>

// ✅ CORRECT - Use DatePicker component
<DatePicker
  selected={dateValue}
  onChange={setDateValue}
  dateFormat="dd.MM.yyyy"
/>
```

---

## Quick Reference

### Before Creating New Entity
1. Create entity file in `src/database/entities/`
2. **Export from `index.ts`** ← CRITICAL
3. Register in module: `TypeOrmModule.forFeature([Entity])`
4. Generate migration: `npm run migration:generate`

### Before Creating Zustand Selector
1. Return single primitive value
2. Create separate hook for each value
3. Test that component doesn't infinite loop

### When Adding Date Input
1. Use `DatePicker` component from `@/components/common/DatePicker`
2. Never use native `<input type="date">`
3. Set appropriate `dateFormat` (default: dd.MM.yyyy)
4. Add validation with `minDate` / `maxDate` if needed

### Before Committing
- [ ] No `any` types
- [ ] Path aliases used
- [ ] DTOs have validation
- [ ] Errors handled with NestJS exceptions
- [ ] Logger added for important operations
- [ ] Entity exported from index.ts
- [ ] FSM used for status changes
- [ ] DatePicker used instead of native date inputs

---

## Related Documentation

- See `architecture/database.md` for TypeORM patterns
- See `frontend/zustand-patterns.md` for detailed Zustand guide
- See `modules/orders.md` for FSM patterns
- See `reference/pitfalls.md` for common mistakes
