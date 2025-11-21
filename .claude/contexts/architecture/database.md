# TypeORM Entity Loading - CRITICAL

## Webpack Bundling Issue

**The application uses Webpack bundling (`nest-cli.json` has `"webpack": true`)**, which means glob patterns for entity loading don't work at runtime because all code is bundled into `dist/main.js`.

## Current Implementation

**In `app.module.ts`:**
```typescript
import * as entities from './database/entities';

TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    // ...
    entities: Object.values(entities).filter(val =>
      typeof val === 'function' && val.prototype
    ),
  }),
})
```

**DO NOT change this back to glob patterns** like `[__dirname + '/**/*.entity{.ts,.js}']` - they will fail with Webpack.

The filter removes enums and other non-entity exports from the entities index file.

## For Migrations (data-source.ts)

Migrations use `ts-node` (not Webpack), so glob patterns work:

```typescript
// src/database/data-source.ts
export default new DataSource({
  // ...
  entities: [__dirname + '/../**/*.entity{.ts,.js}'], // ✅ Works for migrations
})
```

## Critical Rules

1. **Always export entities from `src/database/entities/index.ts`**
2. **Never use glob patterns in app.module.ts**
3. **Entity must be registered in module**: `TypeOrmModule.forFeature([MyEntity])`

## Database Transactions

Use TypeORM QueryRunner for transactions:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();

try {
  await queryRunner.manager.save(entity1);
  await queryRunner.manager.save(entity2);
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

## Common Pitfalls

1. **Entity not found errors** - Ensure entity is exported from `src/database/entities/index.ts`
2. **Webpack vs ts-node** - Remember entity loading differs between `app.module.ts` (Webpack) and `data-source.ts` (ts-node)
