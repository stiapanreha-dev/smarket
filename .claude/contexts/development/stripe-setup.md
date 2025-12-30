# Stripe Setup Guide

Complete guide for setting up Stripe payment integration in local development.

## Overview

SnailMarketplace uses Stripe for payment processing with webhook support for real-time payment events. This guide covers the complete setup process for local development.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Local Development Workflow](#local-development-workflow)
- [Testing Webhooks](#testing-webhooks)
- [Webhook Events Reference](#webhook-events-reference)
- [Troubleshooting](#troubleshooting)
- [Production Setup](#production-setup)

---

## Prerequisites

- Node.js 18+ installed
- Backend and frontend servers running locally
- Docker containers (PostgreSQL, Redis) running
- Stripe account (free test mode account)

---

## Installation

### Step 1: Install Stripe CLI

The Stripe CLI is required for forwarding webhooks to your local development environment.

#### macOS

```bash
brew install stripe/stripe-cli/stripe
```

#### Linux (Debian/Ubuntu)

```bash
# Add Stripe package repository
wget -qO- https://packages.stripe.dev/api/gpg.key | sudo apt-key add -
echo "deb https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list

# Update and install
sudo apt update
sudo apt install stripe
```

#### Linux (Other distributions)

```bash
# Download latest release
wget https://github.com/stripe/stripe-cli/releases/download/v1.32.0/stripe_1.32.0_linux_x86_64.tar.gz

# Extract
tar -xvf stripe_1.32.0_linux_x86_64.tar.gz

# Move to PATH
sudo mv stripe /usr/local/bin/

# Make executable
sudo chmod +x /usr/local/bin/stripe
```

#### Windows

**Using Chocolatey:**
```bash
choco install stripe
```

**Using Scoop:**
```bash
scoop install stripe
```

**Manual installation:**
1. Download from https://github.com/stripe/stripe-cli/releases
2. Extract to desired location
3. Add to PATH environment variable

### Step 2: Verify Installation

```bash
stripe --version
```

Expected output: `stripe version X.X.X`

---

## Configuration

### Step 1: Get Stripe Test API Keys

1. **Create Stripe account** (if you don't have one):
   - Go to https://dashboard.stripe.com/register
   - Sign up for free

2. **Get test API keys**:
   - Navigate to https://dashboard.stripe.com/test/apikeys
   - You'll see two keys:
     - **Publishable key**: `pk_test_...` (safe to expose in frontend)
     - **Secret key**: `sk_test_...` (must be kept secret)

**CRITICAL:** Always use TEST keys (pk_test_..., sk_test_...) in development. Never use LIVE keys (pk_live_..., sk_live_...)!

### Step 2: Configure Environment Variables

1. **Copy `.env.example` to `.env`** (if not already done):
```bash
cp .env.example .env
```

2. **Add Stripe keys to `.env`**:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** You'll get the `STRIPE_WEBHOOK_SECRET` in Step 3.

### Step 3: Login to Stripe CLI

```bash
stripe login
```

This will:
1. Open your browser
2. Ask you to authorize the CLI
3. Save credentials locally

### Step 4: Start Webhook Listener

```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

**Expected output:**
```
Ready! You are using Stripe API Version [2025-02-24]. Your webhook signing secret is whsec_xxx... (^C to quit)
```

**Copy the webhook signing secret** and add it to your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx_your_secret_here
```

### Step 5: Restart Backend

After updating `.env`, restart your backend server to load the new environment variables:

```bash
# Stop current server (Ctrl+C)
# Restart
npm run start:dev
```

---

## Local Development Workflow

### Running All Services

You should have **3 terminal windows** running:

**Terminal 1: Backend**
```bash
npm run start:dev
```

**Terminal 2: Frontend**
```bash
cd client
npm run dev
```

**Terminal 3: Stripe Webhook Listener**
```bash
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe
```

### Making a Test Payment

1. **Frontend**: http://localhost:5173
2. Add products to cart
3. Go to checkout
4. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - **3D Secure**: `4000 0025 0000 3155`
   - **Insufficient funds**: `4000 0000 0000 9995`
5. Any future expiry date (e.g., 12/34)
6. Any CVC (e.g., 123)
7. Any ZIP code

### Watching Webhooks

In Terminal 3 (Stripe listener), you'll see webhook events in real-time:

```
2025-11-22 13:45:17  --> payment_intent.created [evt_xxx]
2025-11-22 13:45:18  --> payment_intent.succeeded [evt_xxx]
2025-11-22 13:45:18  <--  [200] POST http://localhost:3000/api/v1/webhooks/stripe [evt_xxx]
```

---

## Testing Webhooks

### Manual Webhook Testing

#### Using Stripe CLI

Trigger specific webhook events:

```bash
# Successful payment
stripe trigger payment_intent.succeeded

# Failed payment
stripe trigger payment_intent.payment_failed

# Refund
stripe trigger charge.refunded

# Customer created
stripe trigger customer.created
```

#### Using curl

Test webhook endpoint directly:

```bash
curl -X POST http://localhost:3000/api/v1/webhooks/stripe \
  -H "stripe-signature: test_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test_123",
        "amount": 10000,
        "currency": "usd",
        "status": "succeeded"
      }
    }
  }'
```

**Note:** This bypasses signature verification, suitable only for local testing.

### Automated Testing

#### E2E Tests with Webhooks

```bash
# Run E2E tests
npm run test:e2e

# Run specific checkout test
npm test -- test/checkout-order-integration.e2e-spec.ts
```

#### Unit Tests for Webhook Handler

```bash
# Test webhook service
npm test -- src/modules/payment/services/webhook.service.spec.ts
```

---

## Webhook Events Reference

### Payment Events

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `payment_intent.created` | Payment intent created | User initiates payment |
| `payment_intent.succeeded` | Payment successful | Payment completed successfully |
| `payment_intent.payment_failed` | Payment failed | Payment declined or failed |
| `payment_intent.canceled` | Payment canceled | User or system cancels payment |

### Charge Events

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `charge.succeeded` | Charge successful | Funds captured successfully |
| `charge.failed` | Charge failed | Charge attempt failed |
| `charge.refunded` | Charge refunded | Refund processed |
| `charge.updated` | Charge updated | Charge details changed |

### Customer Events

| Event | Description | When Triggered |
|-------|-------------|----------------|
| `customer.created` | Customer created | New customer registered |
| `customer.updated` | Customer updated | Customer details changed |
| `customer.deleted` | Customer deleted | Customer removed |

### Supported Events in SnailMarketplace

The webhook handler in `src/modules/payment/controllers/webhook.controller.ts` processes these events:

- `payment_intent.succeeded` → Confirms order payment
- `payment_intent.payment_failed` → Marks order as failed
- `charge.refunded` → Processes refund for order

---

## Troubleshooting

### Stripe CLI Not Found

**Error:**
```
command not found: stripe
```

**Solution:**
1. Verify installation: `which stripe`
2. Check PATH includes installation directory
3. Restart terminal after installation

### Webhook Secret Mismatch

**Error:**
```
[WARN] STRIPE_SECRET_KEY is not set. Stripe functionality will not work.
```

**Solution:**
1. Ensure `.env` file exists
2. Check STRIPE_WEBHOOK_SECRET is set correctly
3. Restart backend server after updating `.env`

### Signature Verification Failed

**Error:**
```
No signatures found matching the expected signature for payload
```

**Solution:**
1. Ensure `stripe listen` is running
2. Verify STRIPE_WEBHOOK_SECRET in `.env` matches output from `stripe listen`
3. Restart backend after updating secret

### Port Already in Use

**Error:**
```
listen tcp :3000: bind: address already in use
```

**Solution:**
1. Kill existing backend process
2. Or change backend port in `.env`: `PORT=3001`
3. Update webhook listener: `stripe listen --forward-to localhost:3001/api/v1/webhooks/stripe`

### Webhooks Not Reaching Backend

**Symptoms:**
- Stripe listener shows events
- Backend doesn't log webhook processing

**Solution:**
1. Verify backend is running: `curl http://localhost:3000/api/v1/health`
2. Check firewall isn't blocking connections
3. Ensure webhook endpoint is correct: `/api/v1/webhooks/stripe`
4. Check backend logs for errors

### Test Card Declined

**Error:**
```
Your card was declined
```

**Solution:**
- Use correct test card: `4242 4242 4242 4242`
- Check you're using test mode keys (pk_test_...)
- Verify amount is above minimum ($0.50 USD)

---

## Production Setup

### Production Webhook Configuration

**IMPORTANT:** Production setup is different from local development!

### Step 1: Configure Production Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter production URL:
   ```
   https://market.devloc.su/api/v1/webhooks/stripe
   ```
4. Select events to listen to:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **Add endpoint**

### Step 2: Get Production Webhook Secret

1. Copy the **Signing secret** (whsec_...)
2. Add to production environment variables

### Step 3: Production Environment Variables

```bash
# Production .env (on server)
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

**CRITICAL:**
- ✅ Use LIVE keys (sk_live_..., pk_live_...) in production
- ✅ Use different webhook secret for production
- ❌ Never commit secrets to git
- ❌ Never use test keys in production

### Testing Production Webhooks

Use Stripe CLI to test production webhooks:

```bash
# Forward events to production endpoint
stripe listen --forward-to https://market.devloc.su/api/v1/webhooks/stripe --api-key sk_live_...

# Trigger test event
stripe trigger payment_intent.succeeded --api-key sk_live_...
```

---

## Architecture Notes

### Webhook Processing Flow

```
Stripe → Stripe CLI Listener → Local Backend → Database
                                      ↓
                              CheckoutService
                                      ↓
                               OrderService
                                      ↓
                            Update Order Status
```

### Key Files

- **Webhook Controller**: `src/modules/payment/controllers/webhook.controller.ts`
- **Webhook Service**: `src/modules/payment/services/webhook.service.ts`
- **Stripe Provider**: `src/modules/payment/providers/stripe.provider.ts`
- **Stripe Config**: `src/config/stripe.config.ts`
- **Frontend Config**: `client/src/config/stripe.config.ts`

### Security

- Webhook signature verification is **required** in production
- Signature validation implemented in `webhook.service.ts`
- Test mode allows bypassing signature for local testing only

---

## Quick Reference

### Common Commands

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Start webhook listener
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Trigger test event
stripe trigger payment_intent.succeeded

# View Stripe logs
stripe logs tail

# Get webhook secret
stripe listen --print-secret

# Test webhook endpoint
curl -X POST http://localhost:3000/api/v1/webhooks/stripe

# View API version
stripe api get /v1/account
```

### Environment Variables

```bash
# Required for Stripe functionality
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Test Cards

| Card Number | Result |
|-------------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | 3D Secure |
| 4000 0000 0000 9995 | Insufficient funds |

---

## Resources

- **Stripe Dashboard**: https://dashboard.stripe.com/
- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Webhook Events**: https://stripe.com/docs/api/events/types
- **Test Cards**: https://stripe.com/docs/testing
- **API Reference**: https://stripe.com/docs/api

---

## Related Documentation

- Main quickstart: `.claude/contexts/01-quickstart.md`
- Payment module: `src/modules/payment/README.md`
- Checkout module: `.claude/contexts/modules/checkout.md`
- Orders module: `.claude/contexts/modules/orders.md`
