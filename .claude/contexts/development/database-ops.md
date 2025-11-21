# Database Operations

Migration management and database operations.

## Migration Commands

```bash
# Generate new migration (auto-detects entity changes)
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Seed database with test data
npm run seed
```

## Creating Migrations

### Automatic Generation (Recommended)

1. Modify entity or create new entity
2. Export entity from `src/database/entities/index.ts`
3. Generate migration:
   ```bash
   npm run migration:generate -- src/database/migrations/AddWishlistTable
   ```
4. Review generated SQL
5. Run migration:
   ```bash
   npm run migration:run
   ```

### Manual Migration (Not Recommended)

Only create manual migrations for data migrations or complex operations that TypeORM can't auto-generate.

## Migration Structure

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWishlistTable1234567890 implements MigrationInterface {
  name = 'AddWishlistTable1234567890';

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wishlists"`);
  }
}
```

## Migration Best Practices

1. **Always use auto-generation** - Reduces human error
2. **Make migrations reversible** - Implement `down()` method
3. **Test locally first** - Run on dev before production
4. **Review generated SQL** - Ensure it does what you expect
5. **Export entities** - Always export from `index.ts` before generating

## Entity Export (CRITICAL)

**Always export new entities from `src/database/entities/index.ts`:**

```typescript
// src/database/entities/index.ts
export * from './user.entity';
export * from './product.entity';
export * from './wishlist.entity'; // ← Add new entity export
```

Without this export:
- Webpack bundling will fail
- Entity won't be loaded in `app.module.ts`
- TypeORM won't detect entity changes

## Database Seeding

```bash
# Seed database with test data
npm run seed
```

Seeds create:
- Test users
- Sample products
- Categories
- Test merchants

**Location:** `src/database/seeds/`

## Production Migrations

**CRITICAL**: Production migrations require manual SQL execution.

See `production/migrations.md` for production migration process.

## Common Issues

**"Entity not found":**
- Ensure entity exported from `index.ts`
- Verify `TypeOrmModule.forFeature([Entity])` in module

**"No changes detected":**
- Entity not exported from `index.ts`
- Entity not registered in module

**Migration fails:**
- Check database connection
- Verify migration SQL syntax
- Ensure migrations run in order

## Related

- See `architecture/database.md` for TypeORM entity loading
- See `production/migrations.md` for production process
- See `development/commands.md` for migration commands
