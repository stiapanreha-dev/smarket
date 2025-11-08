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

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
