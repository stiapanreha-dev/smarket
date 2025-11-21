# Modular Monolith Structure

The codebase follows a modular monolith architecture with clear module boundaries.

## Core Modules

### User & Authentication
- **Auth Module** - JWT-based authentication, password hashing with argon2
- **User Module** - User management with locale/currency preferences

### Product & Catalog
- **Catalog Module** - Product catalog (physical, digital, service types)
- **Inventory Module** - Stock management and reservations
- **Booking Module** - Service appointment scheduling

### Shopping & Checkout
- **Cart Module** - Shopping cart management (guest + authenticated)
- **Checkout Module** - Multi-step checkout process with session management

### Orders & Fulfillment
- **Orders Module** - FSM-based order processing
- **Payment Module** - Payment processing with provider abstraction
- **Payout Module** - Merchant payout management

### Supporting Modules
- **Notification Module** - Multi-channel notifications (email, future: SMS)
- **Merchant Module** - Merchant profiles and dashboards
- **Wishlist Module** - User wishlist management

## Module Boundaries

Each module has:
- Clear responsibilities and boundaries
- Own controllers, services, and entities
- TypeORM repositories for data access
- DTOs for validation
- Independent testing

## Path Aliases

Always use TypeScript path aliases configured in `tsconfig.json`:

```typescript
@/* → src/*
@modules/* → src/modules/*
@common/* → src/common/*
@config/* → src/config/*
@database/* → src/database/*
```

## Creating New Modules

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
