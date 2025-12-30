# Makefile for SnailMarketplace CI/CD operations
# Run 'make help' to see all available commands

.PHONY: help install lint typecheck test test-cov test-e2e docker-build docker-run docker-test ci-local clean dev dev-back dev-front up down stop logs db-migrate db-seed

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)SnailMarketplace - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ===========================================
# Development Commands
# ===========================================

up: ## Start Docker containers (PostgreSQL, Redis, LocalStack)
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✓ Containers started$(NC)"
	@echo "  PostgreSQL: localhost:5433"
	@echo "  Redis: localhost:6380"
	@echo "  Adminer: http://localhost:9090"

down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker compose down
	@echo "$(GREEN)✓ Containers stopped$(NC)"

stop: ## Stop everything (kill node processes + containers)
	@echo "$(BLUE)Stopping everything...$(NC)"
	-pkill -f "node.*nest" 2>/dev/null || true
	-pkill -f "node.*vite" 2>/dev/null || true
	docker compose down
	@echo "$(GREEN)✓ All stopped$(NC)"

logs: ## View Docker container logs
	docker compose logs -f

dev-back: ## Start backend dev server
	@echo "$(BLUE)Starting backend...$(NC)"
	npm run start:dev

dev-front: ## Start frontend dev server
	@echo "$(BLUE)Starting frontend...$(NC)"
	cd client && npm run dev

dev: up ## Start full dev environment (containers + backend)
	@echo "$(BLUE)Starting development environment...$(NC)"
	@sleep 2
	npm run start:dev

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running migrations...$(NC)"
	npm run migration:run
	@echo "$(GREEN)✓ Migrations completed$(NC)"

db-seed: ## Seed database with test data
	@echo "$(BLUE)Seeding database...$(NC)"
	npm run seed
	@echo "$(GREEN)✓ Database seeded$(NC)"

db-reset: down ## Reset database (stop, remove volume, start, migrate, seed)
	@echo "$(RED)Resetting database...$(NC)"
	docker volume rm smarket_postgres-data 2>/dev/null || true
	docker compose up -d
	@sleep 3
	npm run migration:run
	npm run seed
	@echo "$(GREEN)✓ Database reset completed$(NC)"

# ===========================================
# Installation & Setup
# ===========================================

install: ## Install dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	npm ci
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	npm run lint
	@echo "$(GREEN)✓ Linting passed$(NC)"

typecheck: ## Run TypeScript type check
	@echo "$(BLUE)Running TypeScript type check...$(NC)"
	npx tsc --noEmit
	@echo "$(GREEN)✓ Type check passed$(NC)"

test: ## Run unit tests
	@echo "$(BLUE)Running unit tests...$(NC)"
	npm run test
	@echo "$(GREEN)✓ Unit tests passed$(NC)"

test-cov: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	npm run test:cov
	@echo "$(GREEN)✓ Coverage report generated$(NC)"
	@echo "Open coverage/index.html to view report"

test-e2e: ## Run E2E tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	npm run test:e2e
	@echo "$(GREEN)✓ E2E tests passed$(NC)"

docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t snailmarketplace:local .
	@echo "$(GREEN)✓ Docker image built$(NC)"

docker-run: docker-build ## Run Docker container locally
	@echo "$(BLUE)Starting Docker container...$(NC)"
	docker run -d -p 3000:3000 --name snailmarketplace-local \
		-e NODE_ENV=production \
		snailmarketplace:local
	@echo "$(GREEN)✓ Container started at http://localhost:3000$(NC)"
	@echo "Run 'docker logs -f snailmarketplace-local' to view logs"
	@echo "Run 'docker stop snailmarketplace-local' to stop"

docker-test: docker-build ## Test Docker image
	@echo "$(BLUE)Testing Docker image...$(NC)"
	docker run --rm -d -p 3000:3000 --name snailmarketplace-test \
		-e NODE_ENV=production \
		snailmarketplace:local
	@sleep 10
	@echo "$(BLUE)Running health check...$(NC)"
	@if curl -f http://localhost:3000/health; then \
		echo "$(GREEN)✓ Health check passed$(NC)"; \
	else \
		echo "$(RED)✗ Health check failed$(NC)"; \
		docker logs snailmarketplace-test; \
		docker stop snailmarketplace-test; \
		exit 1; \
	fi
	@docker stop snailmarketplace-test
	@echo "$(GREEN)✓ Docker image test passed$(NC)"

docker-compose-up: ## Start all services with docker-compose
	@echo "$(BLUE)Starting services with docker-compose...$(NC)"
	docker-compose -f docker-compose.ci.yml up -d
	@echo "$(GREEN)✓ Services started$(NC)"
	@echo "App: http://localhost:3000"
	@echo "Nginx: http://localhost:80"

docker-compose-down: ## Stop all docker-compose services
	@echo "$(BLUE)Stopping services...$(NC)"
	docker-compose -f docker-compose.ci.yml down
	@echo "$(GREEN)✓ Services stopped$(NC)"

docker-compose-logs: ## View docker-compose logs
	docker-compose -f docker-compose.ci.yml logs -f

ci-local: install lint typecheck test ## Run full CI pipeline locally
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)✓ All CI checks passed locally!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""

ci-full: ci-local test-cov docker-test ## Run complete CI with coverage and Docker test
	@echo ""
	@echo "$(GREEN)========================================$(NC)"
	@echo "$(GREEN)✓ Full CI pipeline completed!$(NC)"
	@echo "$(GREEN)========================================$(NC)"
	@echo ""

security-audit: ## Run npm security audit
	@echo "$(BLUE)Running security audit...$(NC)"
	npm audit --audit-level=high
	@echo "$(GREEN)✓ Security audit completed$(NC)"

clean: ## Clean build artifacts and caches
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	rm -rf dist coverage node_modules/.cache
	@echo "$(GREEN)✓ Cleaned$(NC)"

clean-docker: ## Remove local Docker images and containers
	@echo "$(BLUE)Cleaning Docker resources...$(NC)"
	-docker stop snailmarketplace-local snailmarketplace-test 2>/dev/null || true
	-docker rm snailmarketplace-local snailmarketplace-test 2>/dev/null || true
	-docker rmi snailmarketplace:local 2>/dev/null || true
	@echo "$(GREEN)✓ Docker resources cleaned$(NC)"

pre-commit: lint typecheck test ## Run pre-commit checks
	@echo "$(GREEN)✓ Pre-commit checks passed$(NC)"

pre-push: ci-local ## Run pre-push checks
	@echo "$(GREEN)✓ Pre-push checks passed$(NC)"

setup: install ## Initial setup for development
	@echo "$(BLUE)Setting up development environment...$(NC)"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(GREEN)✓ Created .env file$(NC)"; \
	fi
	@echo "$(GREEN)✓ Setup completed$(NC)"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Configure .env file"
	@echo "  2. Run 'make docker-compose-up' to start services"
	@echo "  3. Run 'make test' to verify setup"

status: ## Show CI/CD status
	@echo "$(BLUE)CI/CD Status$(NC)"
	@echo ""
	@echo "Node version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "Docker version: $$(docker --version)"
	@echo ""
	@echo "Running containers:"
	@docker ps --filter "name=snailmarketplace" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
