# Common Development Patterns

Frequently used patterns for DTOs, validation, transactions, and more.

## DTO Validation

Use class-validator decorators on DTOs:

```typescript
import { IsUUID, IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  checkout_session_id: string;

  @IsOptional()
  @IsString()
  payment_intent_id?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddToCartDto {
  @IsUUID()
  product_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
```

## Database Transactions

Use TypeORM QueryRunner for transactions:

```typescript
async createOrder(dto: CreateOrderDto): Promise<Order> {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Create order
    const order = await queryRunner.manager.save(Order, orderData);

    // 2. Create line items
    const lineItems = await queryRunner.manager.save(OrderLineItem, items);

    // 3. Write event to outbox
    await queryRunner.manager.save(OrderOutbox, {
      event_type: 'order.created',
      aggregate_id: order.id,
      payload: { order_id: order.id },
    });

    await queryRunner.commitTransaction();
    return order;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

## Error Handling

Use NestJS built-in exceptions:

```typescript
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

// Not found
if (!product) {
  throw new NotFoundException('Product not found');
}

// Validation error
if (quantity < 1) {
  throw new BadRequestException('Quantity must be at least 1');
}

// Auth error
if (!user) {
  throw new UnauthorizedException('Please log in');
}

// Permission error
if (product.merchant_id !== user.id) {
  throw new ForbiddenException('Not your product');
}
```

## Controller Patterns

```typescript
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@modules/auth/decorators';
import { Public } from '@modules/auth/decorators';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // Public endpoint
  @Public()
  @Get()
  async getProducts() {
    return this.productService.findAll();
  }

  // Protected endpoint with user
  @Get('my')
  async getMyProducts(@CurrentUser() user: User) {
    return this.productService.findByMerchant(user.id);
  }

  // With validation
  @Post()
  async createProduct(
    @CurrentUser() user: User,
    @Body() dto: CreateProductDto,
  ) {
    return this.productService.create(user.id, dto);
  }

  // With params
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
```

## Service Patterns

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['merchant'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['merchant'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async create(merchantId: string, dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create({
      ...dto,
      merchant_id: merchantId,
    });

    return this.productRepository.save(product);
  }
}
```

## Pagination

```typescript
interface PaginationDto {
  page: number;
  limit: number;
}

async findAll(pagination: PaginationDto) {
  const { page = 1, limit = 20 } = pagination;
  const skip = (page - 1) * limit;

  const [items, total] = await this.repository.findAndCount({
    skip,
    take: limit,
    order: { created_at: 'DESC' },
  });

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

## Path Aliases

Always use path aliases for imports:

```typescript
// ✅ CORRECT
import { User } from '@database/entities';
import { AuthService } from '@modules/auth/auth.service';
import { JwtAuthGuard } from '@common/guards';

// ❌ WRONG
import { User } from '../../../database/entities';
import { AuthService } from '../auth/auth.service';
```

## Related

- See `architecture/modules.md` for module structure
- See `architecture/database.md` for entity patterns
- See `development/testing.md` for test patterns
