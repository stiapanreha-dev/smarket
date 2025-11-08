# SnailMarketplace — MVP Architecture (Revised)

## 1) Purpose & Scope
This document defines a **production‑ready MVP** architecture for a multi‑seller marketplace that sells **physical goods**, **bookable services**, and **digital courses**. The goals are: **short TTM**, **operational simplicity**, and **clean evolution path** to microservices when the product-market fit is proven.

---

## 2) Product Capabilities in MVP
- **Catalog**: products, services (time slots), courses; variants/options; images; basic search & filters.
- **Cart & Checkout**: mixed cart (any combination), taxes & shipping estimates, promo codes (single code, fixed/percent).
- **Orders**: one order with multiple **line items**; per‑line lifecycle.
- **Payments**: authorize → capture; **split/escrow** for multi‑seller; partial refund per line.
- **Fulfillment**: shipment labels (manual entry or provider API), tracking; service appointment confirmation; course instant access.
- **Merchant Panel**: manage listings, prices/stock/slots; see payouts, commissions, disputes.
- **Buyer Area**: order status, downloads, reschedule/cancel service (policy‑based).
- **Localization**: i18n (EN/RU/AR), currencies (minor units); RTL for AR.
- **Compliance**: GDPR‑aligned PII handling; initial fiscalization mapping for RU; VAT handling for AE.
- **Support**: email/Telegram notifications; dispute ticket creation (simple workflow).

---

## 3) Non‑Functional Targets (MVP)
- **Availability**: 99.5% monthly.
- **Latency** (p95 at edge): search ≤ 400 ms, checkout critical calls ≤ 600 ms.
- **Data Safety**: PITR backups for DB; object storage versioning; audit log append‑only.
- **Throughput**: design for 30 req/s steady, 150 req/s peak with safe degradation.

---

## 4) High‑Level Architecture (Build‑First)
**Pattern**: _BFF + Modular Monolith_ (PostgreSQL + Redis) with an **Outbox** for asynchronous events.

```
[Web/Mobile] → [API Gateway] → [BFF] → [Modular Monolith]
                                     ├─ Catalog
                                     ├─ Inventory
                                     ├─ Booking
                                     ├─ Orders
                                     ├─ Payments
                                     ├─ Merchants
                                     ├─ Users/Auth
                                     ├─ Notifications
                                     └─ Reporting (operational)
                         Redis  ← locks/cache/queues (lightweight)
                         S3/Blob ← media & course assets
                         Outbox → SQS (future), webhook dispatchers
```

- **BFF**: REST + GraphQL (persisted queries only) for web and mobile; schema tailored to screens.
- **Modular Monolith**: single deployable app, strict module boundaries at code level.
- **Outbox**: reliable emission of domain events for search indexing, emails, and (later) external services.
- **Redis**: cache, **inventory reservations**, **booking locks**, idempotency tokens with TTL.
- **Storage**: S3‑compatible for images & course video; signed URLs; optional HLS for courses.

_Why:_ this trims infra complexity, keeps transactions local, and preserves a straight path to service extraction.

---

## 5) Domain Model (Essential Entities)

### 5.1 Users & Merchants
- `users(id, email, phone, password_hash, locale, ... )`
- `merchants(id, user_owner_id, legal_name, kyc_status, payout_method, ...)`

### 5.2 Catalog
- `products(id, merchant_id, type:[PHYSICAL|SERVICE|COURSE], title, description, attrs jsonb, status)`
- `product_variants(id, product_id, sku, price_minor, currency, inventory_policy, ... )`
- `media_assets(id, owner_type, owner_id, url, kind)`
- `service_schedules(id, product_id, tz, rrule, exceptions)`
- `course_access_policies(id, product_id, delivery:[FILE|STREAM|LINK], drm jsonb)`

### 5.3 Orders & Lines
- `orders(id, buyer_id, currency, total_minor, status, placed_at, ...)`
- `order_lines(id, order_id, item_type, product_variant_id, qty, price_minor, status, ... )`
- `shipments(id, order_id, carrier, tracking, status, ...)`

### 5.4 Payments & Splits
- `payments(id, order_id, psp, status, idempotency_key, auth_amount_minor, captured_minor, ...)`
- `payment_splits(id, payment_id, merchant_id, amount_minor, fee_minor, hold_until)`
- `payouts(id, merchant_id, batch_id, amount_minor, currency, status)`
- `reconciliation(id, provider, reference, status, diff jsonb, settled_at)`

### 5.5 Inventory & Booking
- `inventory_levels(variant_id, on_hand, reserved)`
- `reservations(id, scope:[INVENTORY|SLOT], key, owner, ttl_expires_at)`
- `bookings(id, order_line_id, start_at, end_at, tz, status)`

---

## 6) Core Lifecycles (FSM per Line Type)

### 6.1 Physical Line FSM
```
NEW → RESERVED → PAID → FULFILLING → SHIPPED → DELIVERED → CLOSED
             ↘ CANCELLED (expiry / payment_fail / user_cancel)
```

- **Reserve**: decrement `reserved` with TTL via Redis lock + DB txn.
- **Pay**: authorize full order; capture per line when moving to FULFILLING.
- **Refunds**: partial allowed from any non‑closed state; restock policy‑based.

### 6.2 Service (Booking) Line FSM
```
NEW → SLOT_RESERVED → PAID → CONFIRMED → SERVED → CLOSED
       ↘ CANCELLED (policy & window)   ↘ NO_SHOW (policy)
```

- **Slot lock**: Redis `SET NX PX` on `(provider, timeslot)` + DB row for booking.
- **Reschedule/Cancel**: enforce business policy (fees/blackout windows).

### 6.3 Course Line FSM
```
NEW → PAID → ACCESS_GRANTED → CONSUMED → CLOSED
         ↘ REFUNDED (content access window/policy)
```

- **Delivery**: signed URLs, link expiry, watermark support.

---

## 7) Checkout, Idempotency & Consistency

- **Idempotency**: header `X‑Idempotency‑Key` stored on `payments` and `orders`.
- **Order Placement**:
  1) Validate & **reserve** inventory/slots (TTL).  
  2) Create draft `order` + lines.  
  3) **Authorize** payment (sum of payable lines).  
  4) Transition lines to PAID or revert reservations on failure.
- **Capture**:
  - Physical: on transition to FULFILLING.
  - Service/Course: immediately on confirmation/access grant.
- **Expiry Jobs**: background worker releases stale `reservations` and reverts draft orders.

---

## 8) Payments, Escrow & Payouts (MVP)

- PSPs: start with one primary (e.g., Stripe/ЮKassa/Network Intl), second as fallback later.
- **Split/escrow** at application layer: create `payment_splits` per merchant on auth.
- **Webhooks**: signed, retried, deduplicated; map to domain events (AUTH_SUCCEEDED, CAPTURED, REFUNDED).
- **Payouts**: simple **periodic batch** per merchant (e.g., D+7) from escrow account; generate statements.
- **Reconciliation**: minimal ledger tables + daily job comparing PSP reports to `payments` & `payouts`.

---

## 9) Search & Indexing (MVP)
- Start on **PostgreSQL** with GIN/Trigram for basic search and filters.
- Emit `ProductChanged`, `AvailabilityChanged`, `TranslationChanged` events to update denormalized search tables.
- Upgrade to OpenSearch after 50–100k SKUs or when query latency breaches SLO.

---

## 10) Interfaces & Integrations

- **BFF**:
  - REST for webhooks and payment redirects.
  - GraphQL for app screens using **persisted queries only**; depth & complexity limits; DataLoader for N+1.
- **Notifications**: email/Telegram via provider SDK; template storage (locale‑aware); audit of sends.
- **Media**: S3 with signed URLs; optional HLS for courses (segment‑level TTL).
- **Shipping**: MVP — manual carrier/tracking entry; integrate provider API later.
- **Fiscalization (RU)**: adapter layer (ATOL/OrangeData) with mapping by `order_line.type` and VAT rates.

---

## 11) Security & Privacy

- AuthN: JWT access (short) + rotating refresh; device & session management.
- AuthZ: role‑based (buyer, merchant, admin); resource scoping for merchant data.
- **PII**: classification; encryption at rest; access via service layer only.
- **RLS**: PostgreSQL Row‑Level Security for merchant‑owned tables.
- **Secrets**: stored in Secrets Manager (.env only for local dev); key rotation plan.
- **Audit**: append‑only log for admin/financial actions (WORM storage in object store).

---

## 12) Deployment & Operations (MVP)

- **Runtime**: Docker; single app container + sidecar worker; Nginx at edge.
- **Scaling**: start with vertical scaling; enable HPA by CPU/RAM when needed.
- **Resilience**: health checks; graceful shutdowns; `PodDisruptionBudget` when moving to K8s.
- **Backups**: daily full + WAL (PITR) for DB; object storage versioning; restore drills.
- **Observability**: logs (JSON), metrics (business + infra), tracing (sampled); SLO dashboards.
- **Feature Flags**: toggle providers (PSP, carrier), promo engine, and experimental flows.

---

## 13) Internationalization & Money

- Money stored in **minor units** (integers) with `currency` per amount.
- Exchange rate recorded at **authorization**; keep original & converted totals.
- Number/date formats and RTL layout in clients; catalog translations stored in `attrs` or side tables.

---

## 14) Evolution Path (Post‑MVP)

- Extract **Payments** first (own DB + webhook intake) when volume grows.
- Extract **Search** to OpenSearch when catalog/query latency exceeds SLO.
- Introduce **SQS** and dedicated consumers for email/indexing/analytics via Outbox events.
- Add **anti‑fraud** (velocity limits, device fingerprint, step‑up MFA) at checkout.
- Expand shipping to carrier APIs; smart slots/overbooking policies for services.

---

## 15) Reference Sequence (Checkout Happy Path)
1. BFF validates cart → requests **reserve** from Inventory/Booking.
2. Monolith creates `order(draft)` + `order_lines`.
3. Payments: create intent (idempotent) → **authorize**.
4. On success:
   - Physical lines → `PAID`, schedule capture on fulfillment.
   - Service lines → confirm slot → capture now.
   - Course lines → grant access → capture now.
5. Emit events → Notifications → update search views.
6. Commit; clear client‑side idempotency token.
