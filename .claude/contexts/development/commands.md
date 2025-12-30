# Development Commands

Daily commands for development workflow.

## Makefile Commands (Recommended)

Use `make help` to see all available commands.

### Quick Start

```bash
make dev        # Start everything (containers + backend)
make dev-front  # In another terminal - start frontend
```

### Development

| Command | Description |
|---------|-------------|
| `make up` | Start Docker containers |
| `make down` | Stop Docker containers |
| `make stop` | Stop everything (node + containers) |
| `make dev` | Start full dev environment |
| `make dev-back` | Start backend only |
| `make dev-front` | Start frontend only |
| `make logs` | View container logs |

### Database

| Command | Description |
|---------|-------------|
| `make db-migrate` | Run migrations |
| `make db-seed` | Seed test data |
| `make db-reset` | Reset database completely |

### CI/CD

| Command | Description |
|---------|-------------|
| `make install` | Install dependencies |
| `make lint` | Run ESLint |
| `make typecheck` | TypeScript check |
| `make test` | Run unit tests |
| `make test-cov` | Tests with coverage |
| `make ci-local` | Full CI pipeline locally |

## npm Commands

### Setup and Running

```bash
# Install dependencies
npm install

# Start infrastructure (PostgreSQL, Redis, LocalStack, Adminer)
docker compose up -d

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

### Database Operations

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

### Testing

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

### Code Quality

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
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f [service-name]

# Restart specific service
docker compose restart postgres

# Rebuild containers
docker compose up -d --build
```

## Quick Start for New Developers

### Using Makefile (Recommended)

```bash
# 1. Clone and install
git clone <repo-url>
cd smarket
make install

# 2. Start everything
make dev          # Terminal 1: containers + backend

# 3. Start frontend
make dev-front    # Terminal 2: frontend

# 4. Stop when done
make stop
```

### Using npm

```bash
# 1. Clone and install
git clone <repo-url>
cd smarket
npm install

# 2. Start infrastructure
docker compose up -d

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
