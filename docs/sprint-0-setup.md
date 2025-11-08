# Sprint 0: Project Setup & Infrastructure
## Foundation Week (День 1-5)

**Dates:** 15-19 Января 2024  
**Goal:** Подготовить всю инфраструктуру для разработки  
**Team:** Вся команда  

---

## 🎯 Sprint Goals

1. **Development Environment** готов у всех разработчиков
2. **CI/CD Pipeline** настроен и работает
3. **База данных** спроектирована и развернута
4. **Project Structure** создана и протестирована
5. **Team Processes** установлены и задокументированы

---

## 📋 User Stories

### SETUP-001: Project Initialization (8 SP)
**As a** developer  
**I want** to have project structure ready  
**So that** I can start development immediately  

**Acceptance Criteria:**
- [ ] NestJS project initialized
- [ ] TypeScript configured
- [ ] ESLint & Prettier configured
- [ ] Jest testing setup
- [ ] Docker configuration ready
- [ ] README with setup instructions

**Tasks:**
```bash
# 1. Initialize NestJS project
npm i -g @nestjs/cli
nest new marketplace-backend

# 2. Configure TypeScript (tsconfig.json)
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@modules/*": ["src/modules/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"]
    }
  }
}

# 3. Setup folder structure
src/
├── modules/
│   ├── auth/
│   ├── user/
│   ├── catalog/
│   ├── order/
│   ├── payment/
│   └── notification/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   └── pipes/
├── config/
│   ├── database.config.ts
│   ├── redis.config.ts
│   └── app.config.ts
├── database/
│   ├── migrations/
│   └── seeds/
└── main.ts
```

---

### SETUP-002: Database Setup (5 SP)
**As a** developer  
**I want** database configured and accessible  
**So that** I can start implementing features  

**Tasks:**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: marketplace_db
    environment:
      POSTGRES_USER: marketplace
      POSTGRES_PASSWORD: secret123
      POSTGRES_DB: marketplace_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U marketplace"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: marketplace_cache
    command: redis-server --appendonly yes --requirepass redis123
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  localstack:
    image: localstack/localstack:latest
    container_name: marketplace_localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,sqs,ses
      - DEFAULT_REGION=us-east-1
      - DATA_DIR=/tmp/localstack/data
    volumes:
      - localstack_data:/tmp/localstack
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  postgres_data:
  redis_data:
  localstack_data:
```

**Database Schema (Initial):**
```sql
-- init.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    locale VARCHAR(5) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    tax_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    commission_rate DECIMAL(5,4) DEFAULT 0.15,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_user_id ON merchants(user_id);
```

---

### SETUP-003: CI/CD Pipeline (8 SP)
**As a** team  
**I want** automated CI/CD pipeline  
**So that** we can deploy safely and quickly  

**GitHub Actions Workflow:**
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:cov
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/coverage-final.json

  build:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: docker/setup-buildx-action@v2
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

### SETUP-004: Development Environment (5 SP)
**As a** developer  
**I want** consistent development environment  
**So that** "works on my machine" never happens  

**.env.example:**
```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=marketplace
DATABASE_PASSWORD=secret123
DATABASE_NAME=marketplace_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis123

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRES_IN=30d

# AWS (LocalStack in development)
AWS_ENDPOINT=http://localhost:4566
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET=marketplace-assets

# Email (LocalStack SES)
EMAIL_FROM=noreply@marketplace.local
```

**Makefile for common tasks:**
```makefile
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make setup       - Initial project setup"
	@echo "  make dev         - Start development environment"
	@echo "  make test        - Run tests"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with test data"

setup:
	npm install
	cp .env.example .env
	docker-compose up -d
	sleep 5
	npm run migration:run
	npm run seed:dev

dev:
	docker-compose up -d
	npm run start:dev

test:
	npm run test:watch

migrate:
	npm run migration:run

seed:
	npm run seed:dev

clean:
	docker-compose down -v
	rm -rf dist node_modules
```

---

### SETUP-005: Monitoring & Logging (5 SP)
**As a** DevOps engineer  
**I want** logging and monitoring from day one  
**So that** we can track issues in production  

**Logger Configuration:**
```typescript
// src/config/logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          return `${timestamp} [${context}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.json(),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.json(),
    }),
  ],
});

// Health check endpoint
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }
}
```

---

## 📊 Daily Plan

### Day 1 (Monday): Project Setup
- [ ] Initialize repositories
- [ ] Setup NestJS project
- [ ] Configure TypeScript, ESLint, Prettier
- [ ] Create folder structure
- [ ] Setup Git hooks (Husky)

### Day 2 (Tuesday): Database & Infrastructure
- [ ] Setup Docker Compose
- [ ] Configure PostgreSQL
- [ ] Configure Redis
- [ ] Design initial schema
- [ ] Setup TypeORM

### Day 3 (Wednesday): CI/CD
- [ ] Configure GitHub Actions
- [ ] Setup automated testing
- [ ] Configure Docker builds
- [ ] Setup staging deployment

### Day 4 (Thursday): Development Tools
- [ ] Configure logging
- [ ] Setup health checks
- [ ] Create Makefile
- [ ] Document setup process
- [ ] Setup Swagger

### Day 5 (Friday): Testing & Documentation
- [ ] Write initial tests
- [ ] Create API documentation template
- [ ] Team onboarding session
- [ ] Sprint review & retro

---

## ✅ Definition of Done

- [ ] All developers can run project locally
- [ ] CI/CD pipeline passes all checks
- [ ] Database migrations work
- [ ] Health check endpoint returns 200
- [ ] Documentation is complete
- [ ] Team knows how to use all tools

---

## 📈 Success Metrics

- Setup time for new developer < 30 minutes
- CI pipeline runs < 5 minutes
- All health checks passing
- 100% team satisfaction with setup

---

## 🔄 Handover to Sprint 1

**Ready for Development:**
- ✅ Project structure ready
- ✅ Database configured
- ✅ CI/CD operational
- ✅ Team onboarded

**Next Sprint Preview:**
- User registration
- JWT authentication
- User profiles
- Password reset

---

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

**Sprint 0 sets the foundation for success! 🚀**