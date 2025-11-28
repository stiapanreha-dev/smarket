# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

SnailMarketplace is a modular monolith marketplace platform built with NestJS, PostgreSQL, Redis, and S3. It supports three product types: physical goods, digital products, and services. The platform features multi-language support (EN/RU/AR), FSM-based order management, and event-driven architecture with the Outbox pattern.

**Domain**: https://smarket.sh3.su

---

## 🚀 Quick Navigation

- **First time?** → @./.claude/contexts/01-quickstart.md
- **Architecture overview?** → @./.claude/contexts/architecture/modules.md
- **Production issues?** → @./.claude/contexts/production/troubleshooting.md
- **Full context index** → @./.claude/contexts/README.md

---

## Core Architecture

@./.claude/contexts/architecture/modules.md
@./.claude/contexts/architecture/database.md
@./.claude/contexts/architecture/events-outbox.md
@./.claude/contexts/architecture/fsm.md
@./.claude/contexts/architecture/authentication.md

## Critical Patterns (MUST READ)

@./.claude/contexts/development/code-style.md
@./.claude/contexts/modules/cart.md
@./.claude/contexts/frontend/zustand-patterns.md
@./.claude/contexts/production/migrations.md

## Module-Specific Context

@./.claude/contexts/modules/auth.md
@./.claude/contexts/modules/booking.md
@./.claude/contexts/modules/catalog.md
@./.claude/contexts/modules/checkout.md
@./.claude/contexts/modules/inventory.md
@./.claude/contexts/modules/merchant.md
@./.claude/contexts/modules/notification.md
@./.claude/contexts/modules/orders.md
@./.claude/contexts/modules/payment.md
@./.claude/contexts/modules/payout.md
@./.claude/contexts/modules/user.md
@./.claude/contexts/modules/wishlist.md

## Frontend Development

@./.claude/contexts/frontend/styling-layout.md
@./.claude/contexts/frontend/routing.md
@./.claude/contexts/frontend/i18n.md

## Development Workflow

@./.claude/contexts/development/commands.md
@./.claude/contexts/development/testing.md
@./.claude/contexts/development/database-ops.md
@./.claude/contexts/development/common-patterns.md

## Production Operations

@./.claude/contexts/production/deployment.md
@./.claude/contexts/production/nginx-config.md
@./.claude/contexts/production/troubleshooting.md
@./.claude/contexts/production/product-import.md

## Reference Documentation

@./.claude/contexts/reference/infrastructure.md
@./.claude/contexts/reference/ci-cd.md
@./.claude/contexts/reference/config-files.md
@./.claude/contexts/reference/pitfalls.md

---

## API Documentation

- Health check: `GET /health`
- API base: `http://localhost:3000/api/v1`
- Production: `https://smarket.sh3.su/api/v1`
- Module info endpoints: `GET /api/v1/{module}/info`

## Code Review Checklist

When reviewing or writing code:
- [ ] Tests written (>80% coverage target)
- [ ] Error handling implemented
- [ ] Validation on DTOs
- [ ] Database transactions used where needed
- [ ] Events emitted for state changes (when using FSM)
- [ ] Path aliases used for imports
- [ ] No sensitive data in logs
- [ ] Migration reversible where possible
- [ ] TypeScript strict mode compliance

## Documentation Updates

После значимых изменений кода обновляйте документацию в `.claude/contexts/`.

**Когда обновлять:**
- Новый модуль/эндпоинт добавлен
- Критический паттерн изменен (FSM, Zustand, Cart sessions)
- Изменения в production процедурах

**Как обновить:**
1. Используйте `/update-docs` для автоматического анализа
2. Или вручную обновите файл в `.claude/contexts/`

**Маппинг файлов кода → документации:**
- `src/modules/{name}/` → `modules/{name}.md`
- `client/src/store/` → `frontend/zustand-patterns.md`
- `client/src/styles/` → `frontend/styling-layout.md`
- `src/database/entities/` → `architecture/database.md`
