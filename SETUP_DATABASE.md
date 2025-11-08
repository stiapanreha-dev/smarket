# Database Setup Guide

## Quick Start

### 1. Start PostgreSQL

```bash
# Using Docker Compose (recommended)
docker compose up -d postgres

# Wait for PostgreSQL to be ready
docker compose ps postgres
```

### 2. Copy environment file

```bash
cp .env.example .env
```

Default database credentials:
- Host: `localhost`
- Port: `5432`
- Username: `snailmarket`
- Password: `snailmarket_password`
- Database: `snailmarket`

### 3. Install dependencies

```bash
npm install
```

### 4. Run migrations

```bash
npm run migration:run
```

This will:
- ✅ Enable PostgreSQL extensions (uuid-ossp, pg_trgm, btree_gin, unaccent)
- ✅ Create users and merchants tables
- ✅ Create products, product_variants, and product_translations tables
- ✅ Add all necessary indexes (B-tree, GIN, Composite)
- ✅ Configure Row-Level Security (RLS) for merchant-owned data

### 5. Seed test data

```bash
npm run seed
```

This creates:
- 3 test users (2 merchants + 1 buyer)
- 2 merchants (TechHub, EduPro)
- 20 products (8 physical, 5 courses, 3 services)
- Translations in EN, RU, AR for all products

## Test Credentials

All users have password: `Test123456!`

### Merchants
- `merchant1@snailmarket.com` - TechHub (EN, USD)
- `merchant2@snailmarket.com` - EduPro (RU, RUB)

### Buyers
- `buyer@snailmarket.com` - (AR, AED)

## Database Management UI

Access Adminer at http://localhost:8080

- System: `PostgreSQL`
- Server: `postgres`
- Username: `snailmarket`
- Password: `snailmarket_password`
- Database: `snailmarket`

## Useful Commands

```bash
# Show migration status
npm run migration:show

# Revert last migration
npm run migration:revert

# Build project
npm run build

# Run tests
npm test

# Start development server
npm run start:dev
```

## Database Schema Overview

### Core Tables

**users**
- User accounts with multi-language and multi-currency support
- Roles: buyer, merchant, admin
- Locales: EN, RU, AR
- Currencies: USD, EUR, RUB, AED

**merchants**
- Merchant profiles with KYC verification
- Payout methods: bank_transfer, paypal, stripe, crypto
- Status: active, inactive, suspended

**products**
- Product catalog
- Types: PHYSICAL, SERVICE, COURSE
- Statuses: draft, active, inactive, out_of_stock, archived
- JSONB attrs for flexible product data

**product_variants**
- SKU management
- Pricing in minor units (cents)
- Inventory policies: deny, continue, track
- JSONB attrs for variant-specific data

**product_translations**
- Multi-language product content
- Full-text search with tsvector
- Trigram search support

### Features

**PostgreSQL Extensions**
- uuid-ossp: UUID generation
- pg_trgm: Trigram similarity search
- btree_gin: GIN indexes for multiple data types
- unaccent: Accent-insensitive text search

**Indexes**
- B-tree on foreign keys and status fields
- GIN on JSONB fields
- GIN on full-text search vectors
- Composite indexes on common query patterns

**Row-Level Security**
- Enabled on merchants, products, product_variants, product_translations
- Merchants can only access their own data
- Admins have full access

## Troubleshooting

### PostgreSQL connection failed

```bash
# Check if PostgreSQL is running
docker compose ps

# View PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Migration fails

```bash
# Check current migration status
npm run migration:show

# If needed, drop database and start over
docker compose down -v postgres
docker compose up -d postgres
npm run migration:run
npm run seed
```

### Seed data already exists

```bash
# Clear database and re-seed
docker compose down -v
docker compose up -d postgres
npm run migration:run
npm run seed
```

## Next Steps

1. Review the database schema in `src/database/README.md`
2. Explore entities in `src/database/entities/`
3. Check migration files in `src/database/migrations/`
4. Start building your application!

## Production Deployment

1. **Never use seed data in production**
2. Update `.env` with production credentials
3. Use managed PostgreSQL service (AWS RDS, Google Cloud SQL, etc.)
4. Set up automated backups (PITR)
5. Monitor migration execution time
6. Test migrations on staging first
7. Keep RLS policies in sync with application logic

## Support

For more details, see:
- Database schema docs: `src/database/README.md`
- Architecture docs: `docs/SnailMarketplace_MVP_Architecture.md`
- TypeORM docs: https://typeorm.io
