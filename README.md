# SnailMarketplace

Modern modular monolith marketplace platform built with NestJS, PostgreSQL, Redis, and S3.

## Features

- **Modular Architecture**: Clear module boundaries with separation of concerns
- **TypeScript**: Strict typing with latest TypeScript features
- **Multi-language Support**: English, Russian, and Arabic (i18next)
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis for high-performance caching
- **Storage**: S3-compatible storage (AWS S3 or LocalStack for development)
- **Health Checks**: Built-in health monitoring endpoints
- **Code Quality**: ESLint + Prettier + Husky pre-commit hooks

## Architecture

### Modules

```
src/
├── modules/
│   ├── auth/          # Authentication & Authorization
│   ├── user/          # User Management
│   ├── catalog/       # Product Catalog
│   ├── inventory/     # Inventory Management
│   ├── booking/       # Booking & Reservations
│   ├── order/         # Order Processing
│   ├── payment/       # Payment Integration
│   └── notification/  # Multi-channel Notifications
├── common/            # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/            # Configuration
└── database/          # Database migrations & seeds
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd smarket
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration if needed.

### 4. Start infrastructure services

```bash
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- LocalStack (S3/SQS) (port 4566)
- Adminer (Database UI) (port 8080)

### 5. Run the application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at: `http://localhost:3000/api/v1`

## Available Scripts

```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start in debug mode

# Build
npm run build          # Build for production

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format code with Prettier

# Testing
npm test               # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Generate coverage report
npm run test:e2e       # Run e2e tests

# Database
npm run migration:generate -- src/database/migrations/MigrationName
npm run migration:run
npm run migration:revert
```

## API Endpoints

### Health Check
- `GET /health` - Application health status

### Info
- `GET /api/v1` - API information

### Modules
- `GET /api/v1/auth/info` - Auth module info
- `GET /api/v1/users/info` - User module info
- `GET /api/v1/catalog/info` - Catalog module info
- `GET /api/v1/inventory/info` - Inventory module info
- `GET /api/v1/bookings/info` - Booking module info
- `GET /api/v1/orders/info` - Order module info
- `GET /api/v1/payments/info` - Payment module info
- `GET /api/v1/notifications/info` - Notification module info

## Docker Services

### Access Adminer (Database UI)
Visit: `http://localhost:8080`

Credentials:
- System: PostgreSQL
- Server: postgres
- Username: snailmarket
- Password: snailmarket_password
- Database: snailmarket

### LocalStack (AWS Services Emulation)
- S3 endpoint: `http://localhost:4566`
- SQS endpoint: `http://localhost:4566`

Configure AWS CLI for LocalStack:
```bash
aws configure --profile localstack
# AWS Access Key ID: test
# AWS Secret Access Key: test
# Default region: us-east-1

# Create S3 bucket
aws --endpoint-url=http://localhost:4566 s3 mb s3://snailmarket-bucket --profile localstack
```

## Project Structure

```
smarket/
├── src/
│   ├── modules/              # Business modules
│   ├── common/               # Shared code
│   ├── config/               # Configuration
│   ├── database/             # Database files
│   ├── app.module.ts         # Root module
│   ├── app.controller.ts     # Root controller
│   ├── app.service.ts        # Root service
│   ├── health.controller.ts  # Health checks
│   └── main.ts              # Entry point
├── test/                     # E2E tests
├── docker-compose.yml        # Docker services
├── .env.example             # Environment template
├── tsconfig.json            # TypeScript config
├── nest-cli.json            # NestJS CLI config
└── package.json             # Dependencies
```

## Development Guidelines

### Code Style
- Follow TypeScript strict mode
- Use ESLint and Prettier (enforced via pre-commit hooks)
- Write meaningful commit messages
- Add JSDoc comments for public APIs

### Module Development
1. Each module should be self-contained
2. Use dependency injection
3. Follow SOLID principles
4. Write unit tests for services
5. Write E2E tests for controllers

### Database Migrations
```bash
# Generate migration
npm run migration:generate -- src/database/migrations/CreateUsersTable

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Application port | `3000` |
| `API_PREFIX` | API route prefix | `api/v1` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | Database username | `snailmarket` |
| `DB_PASSWORD` | Database password | `snailmarket_password` |
| `DB_DATABASE` | Database name | `snailmarket` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRATION` | JWT expiration time | `24h` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_S3_BUCKET` | S3 bucket name | `snailmarket-bucket` |
| `AWS_ENDPOINT` | AWS endpoint (LocalStack) | `http://localhost:4566` |

## Troubleshooting

### Docker services won't start
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Restart
docker-compose up -d
```

### Port already in use
Change the port in `.env` or stop the service using the port:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection issues
1. Ensure PostgreSQL container is running: `docker ps`
2. Check database credentials in `.env`
3. Verify database is created: Access Adminer at `http://localhost:8080`

## CI/CD Pipeline

### Overview

The project uses GitHub Actions for continuous integration and deployment with three main workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`) - Automated testing and quality checks
2. **Staging Deployment** (`.github/workflows/deploy-staging.yml`) - Deploy to staging environment
3. **Production Deployment** (`.github/workflows/deploy-production.yml`) - Blue-green deployment to production

### CI Pipeline Triggers

#### Feature Branches (`feature/**`, `claude/**`)
On every push:
- ✅ ESLint code quality check
- ✅ TypeScript type checking
- ✅ Unit tests
- ✅ Docker image build

#### Pull Requests to `develop`
All feature branch checks plus:
- ✅ Integration tests (with PostgreSQL & Redis)
- ✅ Code coverage report (minimum 80%)
- ✅ Security scan (npm audit + Snyk)
- ✅ Docker image push to registry

### Deployment Workflows

#### Staging (Auto-deploy on merge to `develop`)
1. Build and push Docker image
2. Deploy to staging environment
3. Run E2E tests
4. Run basic performance tests
5. Health checks validation
6. Send notification

#### Production (Manual approval on merge to `main`)
1. Build and push production Docker image
2. **Manual approval gate** (GitHub Environment protection)
3. Blue-Green deployment:
   - Deploy to Green environment
   - Run smoke tests
   - Switch traffic to Green
   - Monitor metrics
4. Automatic rollback on failure
5. Post-deployment monitoring
6. Cleanup old Blue environment

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

#### Docker Hub
- `DOCKER_USERNAME` - Docker Hub username
- `DOCKER_PASSWORD` - Docker Hub password/token

#### Staging Environment
- `STAGING_URL` - Staging environment URL
- `STAGING_SSH_USER` - SSH user for deployment
- `STAGING_HOST` - Staging server hostname
- `E2E_TEST_USERNAME` - E2E test user
- `E2E_TEST_PASSWORD` - E2E test password

#### Production Environment
- `PRODUCTION_URL` - Production environment URL
- `PRODUCTION_GREEN_URL` - Production Green environment URL
- `PRODUCTION_SSH_USER` - SSH user for deployment
- `PRODUCTION_HOST` - Production server hostname
- `MONITORING_URL` - Monitoring system URL

#### Optional
- `SNYK_TOKEN` - Snyk security scanning token
- `SLACK_WEBHOOK_URL` - Slack notifications webhook

### GitHub Environments Setup

Create the following environments in GitHub repository settings:

1. **staging**
   - Auto-deploy enabled
   - Environment URL: `https://staging.snailmarketplace.com`

2. **production-approval**
   - Required reviewers: Add team members
   - Deployment branch: `main` only

3. **production**
   - Required reviewers: Add senior team members
   - Deployment branch: `main` only
   - Environment URL: `https://snailmarketplace.com`

### Deployment Process

#### To Staging
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Make changes and push
git add .
git commit -m "Add new feature"
git push origin feature/my-feature

# 3. Create PR to develop
# CI will run all checks

# 4. Merge PR
# Auto-deploy to staging will trigger
```

#### To Production
```bash
# 1. Create PR from develop to main
# 2. Wait for approval
# 3. Merge PR
# 4. Approve production deployment in GitHub UI
# 5. Monitor deployment progress
```

### Rollback Procedure

#### Automatic Rollback
- Triggers automatically on health check failures
- Switches traffic back to Blue environment
- Alerts team via notifications

#### Manual Rollback
```bash
# Option 1: Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin main

# Option 2: Deploy previous version
# Re-run the production workflow for a previous commit
```

### Docker Build

Build locally:
```bash
# Build image
docker build -t snailmarketplace:local .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  snailmarketplace:local

# Health check
curl http://localhost:3000/health
```

### Monitoring & Alerts

The CI/CD pipeline includes:
- 🏥 Health checks (30s interval)
- 📊 Performance monitoring
- 🔒 Security scanning
- 📈 Error rate tracking
- ⏱️ Response time monitoring
- 📧 Slack/Email notifications

### Best Practices

1. **Always run tests locally** before pushing
   ```bash
   npm run lint
   npm run test
   npm run test:e2e
   ```

2. **Keep feature branches small** - easier to review and deploy

3. **Write meaningful commit messages** - helps with debugging

4. **Update tests** when adding features

5. **Monitor staging** after deployment

6. **Use feature flags** for risky changes

7. **Review coverage reports** - maintain >80% coverage

### Troubleshooting CI/CD

#### CI fails on type check
```bash
# Run locally to see errors
npx tsc --noEmit
```

#### Coverage below threshold
```bash
# Generate coverage report
npm run test:cov
# Check coverage/index.html
```

#### Docker build fails
```bash
# Test build locally
docker build -t test .
```

#### Deployment fails
- Check GitHub Actions logs
- Verify secrets are configured
- Check environment health
- Review error notifications

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request
5. Wait for CI checks to pass
6. Request review
7. Merge after approval

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
