# Production Database Migrations - CRITICAL

**CRITICAL**: Migrations CANNOT be run automatically in production Docker containers.

## Why Automatic Migrations Don't Work

- Source files are not available (only compiled `dist/main.js`)
- TypeORM migration runner requires source files (`.ts` files)
- Production containers only have compiled JavaScript

## Manual Migration Process

### Step 1: Check Migration Files

```bash
# Locally, review migration files
ls -la src/database/migrations/

# Find latest migration
cat src/database/migrations/1234567890-AddWishlistTable.ts
```

### Step 2: Extract SQL

Review the `up()` method and extract SQL commands:

```typescript
// From migration file
public async up(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE "wishlists" (
      "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" uuid NOT NULL,
      "name" varchar NOT NULL,
      "is_public" boolean DEFAULT false,
      "created_at" TIMESTAMP DEFAULT now()
    )
  `);
}
```

### Step 3: Execute SQL on Production

```bash
# Connect to production database (interactive)
ssh Pi4-2 "docker exec -it smarket-postgres-prod psql -U snailmarket -d snailmarket"

# Or execute SQL directly
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c 'YOUR SQL HERE'"
```

### Step 4: Execute Migration SQL

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
CREATE TABLE wishlists (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  name varchar NOT NULL,
  is_public boolean DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
\""
```

### Step 5: Verify Migration

```bash
# Check table exists
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c '\dt wishlists'"

# Check table structure
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c '\d wishlists'"
```

## Example: Adding Notifications Table

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
CREATE TYPE notification_type_enum AS ENUM ('ORDER_UPDATE', 'PAYMENT_SUCCESS', 'SHIPPING_UPDATE', 'BOOKING_REMINDER', 'PROMO');

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  type notification_type_enum NOT NULL,
  title varchar NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
\""
```

## Common Migration Tasks

### Adding Column

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
ALTER TABLE products ADD COLUMN featured boolean DEFAULT false;
\""
```

### Adding Index

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
CREATE INDEX idx_products_merchant_id ON products(merchant_id);
\""
```

### Adding Foreign Key

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
ALTER TABLE wishlists
ADD CONSTRAINT fk_wishlist_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
\""
```

## Migration Best Practices

1. **Test locally first** - Run migration on dev database
2. **Backup before migration** - Always backup production DB
3. **Execute during low traffic** - Minimize user impact
4. **Verify after migration** - Check table structure and data
5. **Keep migration SQL** - Save executed SQL for documentation

## Rollback

If migration fails, execute the `down()` method SQL:

```bash
ssh Pi4-2 "docker exec smarket-postgres-prod psql -U snailmarket -d snailmarket -c \"
DROP TABLE wishlists;
\""
```

## Common Issues

**"relation already exists":**
- Table/column already created
- Skip migration or check current schema

**"syntax error":**
- Review SQL syntax
- Test SQL locally first

**"permission denied":**
- Use snailmarket user (not postgres)
- Check user permissions

## Related

- See `development/database-ops.md` for local migration process
- See `production/troubleshooting.md` for common production issues
- See `production/deployment.md` for deployment process
