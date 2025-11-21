# SnailMarketplace - Project Overview

Modular monolith marketplace platform built with NestJS, PostgreSQL, Redis, and S3.

## What is SnailMarketplace?

A marketplace platform supporting **three product types**:
1. **Physical goods** - Tangible products requiring shipping
2. **Digital products** - Downloadable content (ebooks, software, media)
3. **Services** - Appointments, consultations, sessions

## Key Features

- **Multi-language support** - EN/RU/AR with RTL for Arabic
- **Multi-currency** - USD, EUR, RUB, AED
- **FSM-based order management** - State machines for each product type
- **Event-driven architecture** - Outbox pattern for reliable events
- **Guest checkout** - Session-based cart without registration
- **Multi-tenant** - Marketplace model with platform fees

## Tech Stack

### Backend
- **NestJS** - Node.js framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **TypeORM** - ORM with migrations
- **S3 (LocalStack)** - File storage
- **JWT** - Authentication
- **Argon2** - Password hashing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Bootstrap 5** - UI components
- **Zustand** - State management
- **React Router v6** - Routing
- **react-i18next** - Internationalization

## Architecture

**Modular Monolith** with clear module boundaries:

- Auth, User - Authentication and user management
- Catalog, Inventory, Booking - Product management
- Cart, Checkout - Shopping experience
- Orders, Payment, Payout - Order fulfillment
- Notification, Merchant, Wishlist - Supporting features

## Project Structure

```
/home/lexun/work/smarket/
├── src/                     # Backend (NestJS)
│   ├── modules/            # Business modules
│   ├── database/           # Entities and migrations
│   ├── common/             # Shared utilities
│   └── config/             # Configuration
├── client/                 # Frontend (React)
│   └── src/
│       ├── pages/          # Page components
│       ├── components/     # Reusable components
│       ├── store/          # Zustand stores
│       └── api/            # API client
├── test/                   # Test utilities
├── scripts/                # Import scripts
└── docs/                   # Documentation
```

## Development vs Production

**Development:**
- Local Docker infrastructure (PostgreSQL, Redis, LocalStack)
- Hot reload for backend and frontend
- Adminer for database UI
- LocalStack for S3 emulation

**Production:**
- Pi4-2 (Raspberry Pi) server
- Docker Compose production config
- Nginx reverse proxy
- Let's Encrypt SSL
- Manual database migrations

## Domain

Production: https://smarket.sh3.su

## Core Patterns

1. **Webpack bundling** - Affects entity loading (CRITICAL)
2. **Guest sessions** - x-session-id header for cart
3. **FSM state machines** - Order state transitions
4. **Outbox pattern** - Reliable event publishing
5. **Atomic selectors** - Zustand state management

## Quick Links

- Getting Started: See `01-quickstart.md`
- Architecture Details: See `architecture/` directory
- Module Documentation: See `modules/` directory
- Production Deployment: See `production/deployment.md`

## Next Steps

New to the project? Read `01-quickstart.md` for setup instructions.
