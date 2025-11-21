# Important Configuration Files

Key configuration files and their purposes.

## Backend Configuration

### `nest-cli.json`

**Critical:** Has **Webpack enabled**, affects entity loading.

```json
{
  "webpack": true,  // ← CRITICAL: Affects entity loading
  "sourceRoot": "src"
}
```

**Impact:**
- Entities must be explicitly imported in `app.module.ts`
- Glob patterns won't work at runtime
- See `architecture/database.md` for details

### `tsconfig.json`

**Path aliases** configured here:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@database/*": ["src/database/*"]
    }
  }
}
```

Always use these aliases in imports.

### `src/database/data-source.ts`

TypeORM data source for migrations (uses glob patterns, only runs outside Webpack):

```typescript
export default new DataSource({
  type: 'postgres',
  // ...
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],  // ✅ Glob works for migrations
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
```

**Note:** This file used by `ts-node` for migrations, NOT by runtime app.

### `app.module.ts`

Root module with **explicit entity imports** (required for Webpack):

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

**Critical:** DO NOT use glob patterns here.

### `docker-compose.yml`

Infrastructure services for development:

```yaml
services:
  postgres:
    ports:
      - '${DATABASE_PORT:-5432}:5432'

  redis:
    ports:
      - '${REDIS_PORT:-6379}:6379'

  localstack:
    ports:
      - '4566:4566'

  adminer:
    ports:
      - '9090:8080'
```

### `.env`

Environment configuration (never commit this file):

```bash
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=snailmarket
DATABASE_PASSWORD=snailmarket_password
DATABASE_NAME=snailmarket

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# S3
S3_ENDPOINT=http://localhost:4566
S3_BUCKET=snailmarket-uploads
```

## Frontend Configuration

### `client/vite.config.ts`

Vite build configuration:

```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
```

### `client/.env.production`

Production environment variables:

```bash
VITE_API_BASE_URL=https://smarket.sh3.su/api/v1
```

## Testing Configuration

### `jest.config.js`

Jest test configuration:

```javascript
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### `.env.test`

Test environment configuration:

```bash
DATABASE_NAME=snailmarket_test
NODE_ENV=test
```

## Key Takeaways

1. **nest-cli.json** - Webpack enabled, affects entity loading
2. **tsconfig.json** - Path aliases configuration
3. **data-source.ts** - Migrations only (uses glob patterns)
4. **app.module.ts** - Runtime entity loading (explicit imports)
5. **docker-compose.yml** - Development infrastructure
6. **.env** - Never commit, contains secrets

## Related

- See `architecture/database.md` for entity loading details
- See `development/database-ops.md` for migrations
- See `reference/infrastructure.md` for Docker setup
