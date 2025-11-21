# Quick Start Guide

Get SnailMarketplace running locally in 5 minutes.

## Prerequisites

- **Node.js** 18+ (check: `node --version`)
- **Docker** and Docker Compose (check: `docker --version`)
- **PostgreSQL CLI tools** (for database operations)
- **Git** (check: `git --version`)

## Step-by-Step Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd smarket
npm install
```

### 2. Start Infrastructure

```bash
# Start Docker services (PostgreSQL, Redis, LocalStack, Adminer)
docker-compose up -d

# Verify containers are running
docker-compose ps
```

### 3. Setup Database

```bash
# Run migrations
npm run migration:run

# Seed with test data (optional)
npm run seed
```

### 4. Start Backend

```bash
# Start development server with hot reload
npm run start:dev

# Backend will be available at: http://localhost:3000
```

### 5. Start Frontend

```bash
# In a new terminal
cd client
npm install
npm run dev

# Frontend will be available at: http://localhost:5173
```

## Verify Installation

### Check Backend

```bash
# Health check
curl http://localhost:3000/api/health

# Get catalog info
curl http://localhost:3000/api/v1/catalog/info
```

### Check Frontend

Open http://localhost:5173 in your browser.

### Check Database (Adminer)

1. Open http://localhost:9090
2. Login:
   - System: PostgreSQL
   - Server: postgres
   - Username: snailmarket
   - Password: snailmarket_password
   - Database: snailmarket

## Default Accounts

After seeding, you'll have:

**Test Customer:**
- Email: customer@test.com
- Password: test123

**Test Merchant:**
- Email: merchant@test.com
- Password: test123

## Common Commands

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Generate migration
npm run migration:generate -- src/database/migrations/YourMigration

# Stop infrastructure
docker-compose down
```

## Project Structure Tour

```
src/
├── modules/
│   ├── auth/          # JWT authentication
│   ├── cart/          # Shopping cart (guest + auth)
│   ├── catalog/       # Product catalog
│   ├── checkout/      # Checkout flow
│   ├── orders/        # Order processing (FSM)
│   ├── payment/       # Payment providers
│   └── ...            # 11 modules total
├── database/
│   ├── entities/      # TypeORM entities
│   └── migrations/    # Database migrations
└── common/            # Shared utilities

client/src/
├── pages/             # Page components
├── components/        # Reusable components
├── store/             # Zustand stores
└── api/               # API client
```

## What's Running?

After setup, you should have:

- ✅ Backend API: http://localhost:3000
- ✅ Frontend UI: http://localhost:5173
- ✅ Database: PostgreSQL on port 5432
- ✅ Redis: Port 6379
- ✅ LocalStack (S3): Port 4566
- ✅ Adminer (DB UI): http://localhost:9090

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes**
   - Backend: Edit files in `src/`
   - Frontend: Edit files in `client/src/`

3. **Test changes**
   ```bash
   npm test
   npm run test:e2e
   ```

4. **Create migration** (if needed)
   ```bash
   npm run migration:generate -- src/database/migrations/AddMyFeature
   npm run migration:run
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add my feature"
   git push origin feature/my-feature
   ```

## Troubleshooting

**Port already in use:**
```bash
# Change ports in docker-compose.yml
ports:
  - '5433:5432'  # PostgreSQL
  - '6380:6379'  # Redis
```

**Docker containers won't start:**
```bash
# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

**Migration fails:**
```bash
# Check database is running
docker-compose ps

# Check connection
npm run migration:show
```

**Frontend can't connect to backend:**
- Verify backend is running on port 3000
- Check `client/vite.config.ts` proxy configuration

## Next Steps

- **Read architecture docs**: See `architecture/` directory
- **Explore modules**: See `modules/` directory
- **Learn critical patterns**: Read CRITICAL sections in README.md
- **Run tests**: `npm test` and `npm run test:e2e`
- **Check examples**: Look at existing modules for patterns

## Getting Help

- **Context documentation**: See `.claude/contexts/README.md`
- **Module README files**: Each module has `/src/modules/*/README.md`
- **Test examples**: Check `/test/` directory
- **Common issues**: See `reference/pitfalls.md`

Ready to code! 🚀
