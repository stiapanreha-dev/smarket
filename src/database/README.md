# Database Schema Documentation

## Overview

This directory contains the PostgreSQL database schema for SnailMarketplace, including entities, migrations, and seed data.

## Structure

```
database/
├── entities/          # TypeORM entity definitions
│   ├── user.entity.ts
│   ├── merchant.entity.ts
│   ├── product.entity.ts
│   ├── product-variant.entity.ts
│   └── product-translation.entity.ts
├── migrations/        # Database migrations
│   ├── 1699000000001-CreateExtensions.ts
│   ├── 1699000000002-CreateUsersAndMerchants.ts
│   ├── 1699000000003-CreateProducts.ts
│   └── 1699000000004-CreateRLS.ts
├── seeds/            # Test data
│   ├── main.seed.ts
│   └── run-seed.ts
└── data-source.ts    # TypeORM configuration
```

## Setup Instructions

### 1. Start PostgreSQL

```bash
# Start PostgreSQL using docker-compose
docker-compose up -d postgres

# Verify PostgreSQL is running
docker-compose ps postgres
```

### 2. Run Migrations

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Revert last migration (if needed)
npm run migration:revert
```

### 3. Seed Test Data

```bash
# Populate database with test data
npm run seed
```

## Database Schema

### Tables

#### users
- User accounts (buyers, merchants, admins)
- Multi-language support (EN, RU, AR)
- Multi-currency support (USD, EUR, RUB, AED)

#### merchants
- Merchant profiles
- KYC status tracking
- Payout configuration
- Row-Level Security enabled

#### products
- Product catalog
- Three types: PHYSICAL, SERVICE, COURSE
- JSONB attributes for flexible product data
- Row-Level Security enabled

#### product_variants
- SKU management
- Pricing in minor units (cents)
- Inventory tracking
- JSONB attributes for variant-specific data

#### product_translations
- Multi-language product content
- Full-text search support (tsvector)
- Trigram search enabled

## PostgreSQL Extensions

The following extensions are enabled:

- **uuid-ossp**: UUID generation
- **pg_trgm**: Trigram similarity search
- **btree_gin**: GIN indexes for multiple data types
- **unaccent**: Accent-insensitive text search

## Indexes

### B-tree Indexes
- Foreign keys (user_id, merchant_id, product_id)
- Status fields
- Composite indexes for common queries

### GIN Indexes
- JSONB fields (product attrs, variant attrs)
- Full-text search (product_translations.search_vector)
- Trigram search (product_translations.title, description)

## Row-Level Security (RLS)

RLS is enabled on merchant-owned tables to ensure data isolation:

### Configuration
```sql
-- Set current user context (done by application)
SET app.current_user_id = 'user-uuid';
SET app.current_merchant_ids = ARRAY['merchant-uuid-1', 'merchant-uuid-2'];
SET app.is_admin = 'false';
```

### Policies
- **merchants**: Users can only access their own merchant records
- **products**: Merchants can only manage their own products
- **product_variants**: Tied to product ownership
- **product_translations**: Tied to product ownership

## Test Data

The seed script creates:

- **3 users**:
  - `merchant1@snailmarket.com` (EN, USD) - Password: Test123456!
  - `merchant2@snailmarket.com` (RU, RUB) - Password: Test123456!
  - `buyer@snailmarket.com` (AR, AED) - Password: Test123456!

- **2 merchants**:
  - TechHub (Electronics & Gadgets)
  - EduPro (Online Courses)

- **20 products**:
  - 8 physical products (headphones, watches, keyboards, etc.)
  - 5 digital courses (web dev, Python, data science, etc.)
  - 3 services (laptop repair, screen replacement, data recovery)

- **Translations** for all products in EN, RU, AR

## Useful Commands

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U snailmarket -d snailmarket

# View all tables
\dt

# View table structure
\d users
\d products

# View indexes
\di

# View RLS policies
\d+ merchants

# Test full-text search
SELECT * FROM product_translations WHERE search_vector @@ to_tsquery('web');

# Test trigram search
SELECT * FROM product_translations WHERE title % 'laptop';
```

## Development Workflow

1. **Create a new migration**:
   ```bash
   npm run migration:generate -- src/database/migrations/MyNewMigration
   ```

2. **Run migrations**:
   ```bash
   npm run migration:run
   ```

3. **Seed data** (development only):
   ```bash
   npm run seed
   ```

4. **Verify changes**:
   ```bash
   npm run migration:show
   ```

## Production Considerations

1. **Never use seed data in production**
2. **Always backup before running migrations**
3. **Test migrations on staging first**
4. **Monitor migration execution time**
5. **Keep RLS policies in sync with application logic**

## Troubleshooting

### Migration fails with "relation already exists"
```bash
# Check migration status
npm run migration:show

# If needed, manually mark migration as executed
docker-compose exec postgres psql -U snailmarket -d snailmarket \
  -c "INSERT INTO migrations (timestamp, name) VALUES (1699000000001, 'CreateExtensions1699000000001');"
```

### Seed fails with "duplicate key value"
```bash
# Drop all data and re-seed
docker-compose down -v
docker-compose up -d postgres
npm run migration:run
npm run seed
```

### RLS prevents data access
```sql
-- Temporarily disable RLS for debugging (use carefully!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```
