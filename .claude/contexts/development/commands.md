# Development Commands

Daily commands for development workflow.

## Setup and Running

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, LocalStack, Adminer)
docker-compose up -d

# Run database migrations
npm run migration:run

# Start development server with hot reload
npm run start:dev

# Start in debug mode
npm run start:debug

# Build for production
npm run build

# Run production build
npm run start:prod
```

## Database Operations

```bash
# Generate new migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show

# Seed database
npm run seed
```

## Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test order.service.spec.ts

# Run tests matching pattern
npm test -- --testPathPattern=payment

# Debug tests
npm run test:debug
```

## Code Quality

```bash
# Lint and auto-fix
npm run lint

# Format code
npm run format
```

## Frontend Commands

```bash
# Navigate to frontend
cd client

# Install dependencies
npm install

# Start development server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Docker Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart postgres

# Rebuild containers
docker-compose up -d --build
```

## Quick Start for New Developers

```bash
# 1. Clone and install
git clone <repo-url>
cd smarket
npm install

# 2. Start infrastructure
docker-compose up -d

# 3. Setup database
npm run migration:run
npm run seed

# 4. Start backend
npm run start:dev

# 5. Start frontend (new terminal)
cd client
npm install
npm run dev
```

## Related

- See `development/database-ops.md` for migration details
- See `development/testing.md` for test patterns
- See `reference/infrastructure.md` for Docker setup
