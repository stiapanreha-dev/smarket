# Context Files Index

Modular context system for SnailMarketplace project documentation.

## Quick Navigation

### 🚀 Getting Started
- [00-overview.md](00-overview.md) - Project overview
- [01-quickstart.md](01-quickstart.md) - Quick start guide

### 🏗️ Architecture
- [architecture/modules.md](architecture/modules.md) - Module structure and boundaries
- [architecture/database.md](architecture/database.md) - TypeORM, Webpack, entity loading (CRITICAL)
- [architecture/events-outbox.md](architecture/events-outbox.md) - Outbox pattern for events
- [architecture/fsm.md](architecture/fsm.md) - FSM-based order management
- [architecture/authentication.md](architecture/authentication.md) - JWT, guards, @Public()

### 📦 Modules
- [modules/auth.md](modules/auth.md) - Authentication with Argon2
- [modules/booking.md](modules/booking.md) - Service appointments
- [modules/cart.md](modules/cart.md) - Guest session management (CRITICAL)
- [modules/catalog.md](modules/catalog.md) - Product catalog
- [modules/checkout.md](modules/checkout.md) - Multi-step checkout
- [modules/inventory.md](modules/inventory.md) - Stock management
- [modules/merchant.md](modules/merchant.md) - Merchant dashboards
- [modules/notification.md](modules/notification.md) - Multi-channel notifications
- [modules/orders.md](modules/orders.md) - FSM-based order processing
- [modules/payment.md](modules/payment.md) - Payment providers
- [modules/payout.md](modules/payout.md) - Merchant payouts
- [modules/user.md](modules/user.md) - User management
- [modules/wishlist.md](modules/wishlist.md) - Wishlist features

### 🎨 Frontend
- [frontend/zustand-patterns.md](frontend/zustand-patterns.md) - Atomic selectors (CRITICAL)
- [frontend/styling-layout.md](frontend/styling-layout.md) - Fixed navbar, CSS patterns
- [frontend/routing.md](frontend/routing.md) - React Router patterns
- [frontend/i18n.md](frontend/i18n.md) - Multi-language support (EN/RU/AR)

### 💻 Development
- [development/commands.md](development/commands.md) - npm run scripts
- [development/testing.md](development/testing.md) - Test patterns
- [development/database-ops.md](development/database-ops.md) - Migrations, seeding
- [development/common-patterns.md](development/common-patterns.md) - DTOs, validation, transactions

### 🚀 Production
- [production/deployment.md](production/deployment.md) - Pi4-2 deployment process
- [production/migrations.md](production/migrations.md) - Manual migration process (CRITICAL)
- [production/nginx-config.md](production/nginx-config.md) - Nginx configuration
- [production/troubleshooting.md](production/troubleshooting.md) - Common issues
- [production/product-import.md](production/product-import.md) - Import scripts

### 📚 Reference
- [reference/infrastructure.md](reference/infrastructure.md) - Docker, ports
- [reference/ci-cd.md](reference/ci-cd.md) - GitHub Actions
- [reference/config-files.md](reference/config-files.md) - Important configs
- [reference/pitfalls.md](reference/pitfalls.md) - Common mistakes

## Context by Task

### Working on backend module?
→ Load relevant `modules/*.md` + `architecture/*.md`

### Frontend work?
→ Load `frontend/*.md` files

### Production issues?
→ Load `production/troubleshooting.md` + `production/migrations.md`

### Setting up dev environment?
→ Load `01-quickstart.md` + `reference/infrastructure.md`

### Adding new feature?
→ Load `development/common-patterns.md` + relevant module docs

### Fixing bugs?
→ Load `reference/pitfalls.md` + relevant module docs

## CRITICAL Sections

These sections contain critical patterns that must be followed:

1. **TypeORM Entity Loading** (`architecture/database.md`)
   - Webpack bundling requirements
   - Explicit imports vs glob patterns

2. **Cart Guest Sessions** (`modules/cart.md`)
   - x-session-id header handling
   - Frontend axios interceptor
   - Cart merging on login

3. **Zustand Atomic Selectors** (`frontend/zustand-patterns.md`)
   - Prevents infinite render loops
   - Never return new objects

4. **Production Migrations** (`production/migrations.md`)
   - Manual SQL execution required
   - No automatic migrations

5. **Fixed Navbar CSS** (`frontend/styling-layout.md`)
   - padding-top: 80px required
   - All pages must include

## File Organization

```
.claude/contexts/
├── README.md (this file)
├── 00-overview.md
├── 01-quickstart.md
├── architecture/ (5 files)
├── modules/ (13 files)
├── frontend/ (4 files)
├── development/ (4 files)
├── production/ (5 files)
└── reference/ (4 files)

Total: 38 context files
```

## Usage in Main CLAUDE.md

The main CLAUDE.md file imports these contexts using the `@path` syntax:

```markdown
@./.claude/contexts/architecture/database.md
@./.claude/contexts/modules/cart.md
```

This modular structure:
- Reduces context size
- Improves maintainability
- Allows targeted loading
- Scales with project growth

## Related Documentation

- **Modules**: `/src/modules/*/README.md` - Module-specific docs
- **Scripts**: `/scripts/README.md` - Import scripts documentation
- **Testing**: `/test/README.md` - Test utilities documentation
- **Frontend**: `/client/src/README.md` - Frontend structure
- **Deployment**: `/docs/DEPLOYMENT_SETUP.md` - Production setup
