# Roadmap

## Phase 0 — Foundation & Engineering Rules
**Status: COMPLETE**
- Project documentation.
- Engineering constitution.
- Business rules.
- Architecture boundaries.
- Safe-change workflow.
- Git checkpoints.

## Phase 1 — Product, Classes & Pricing
**Status: COMPLETE & FROZEN**
- Product catalogue.
- Class/category structure.
- Product pricing and availability.
- Admin product management.
- Manual acceptance completed.

## Phase 2 — Inventory & Incoming Stock
**Status: COMPLETE & FROZEN**
- Available stock.
- Incoming stock.
- Stock movement ledger.
- Stock history.
- Safe stock calculations.
- Negative-stock protection.
- Inventory history preservation.
- Manual acceptance completed.

## Phase 3 — Customer Ordering
**Status: COMPLETE & FROZEN**
- Public customer catalogue.
- Product/quantity selection.
- Customer information.
- Order creation and references.
- Customer order confirmation.
- Unpaid orders do not consume stock.
- Manual acceptance completed.

## Phase 4 — Payment Integration
**Status: COMPLETE & FROZEN**
- Paystack transaction initialization.
- Server-side verification.
- Signed webhook handling.
- Idempotency.
- Automatic payment status.
- Payment records.
- Verified-payment stock reduction.
- Insufficient-stock protection.
- Unpaid orders do not reserve/consume stock.
- Manual acceptance completed.
- Production credentials/configuration remain a deployment-phase task.
- SMS and numeric email OTP delivery remain deferred authentication follow-ups.

## Phase 5 — Supply Persons & Delivery
**Status: COMPLETE & FROZEN**
- Admin creates supply persons.
- Admin assigns paid orders.
- Supply person sees assigned orders only.
- System-generated six-digit delivery code.
- Purchase/order-code confirmation.
- Mark Delivered.
- Existing supply states remain `Pending Supply → Assigned → Supplied`.
- Manual acceptance completed.

## Phase 6 — Customer & Order History
**Status: COMPLETE & FROZEN**
- Read-only Customer History derived from orders.
- Read-only Schools view derived from orders.
- Customer-specific order history.
- Payment/supply history.
- No customer table, CRM, or account system added.
- Manual acceptance completed.

## Phase 7 — Admin Dashboard & Business Visibility
**Status: COMPLETE FOR ACCEPTED FIRST SLICE & FROZEN**
- Admin Overview.
- Existing-data-only metrics.
- Simple operational links.
- No new database tables.
- No new business rules.
- No new dependencies.
- No redesign of the accepted Overview.

**Protected:** the accepted Overview must not be changed without an explicit order.

## Phase 8 — Security, Testing & Hardening
**Status: CURRENT — PHASE 8.1 AUTHORIZATION REVIEW + ADMIN WORKSPACE ACCEPTANCE**
- Authorization review.
- Critical workflow tests.
- Audit logging.
- Error handling.
- Backup/recovery verification.
- Performance/security review.

### Phase 8.1 — Authorization Review + Admin Workspace — ACCEPTED PRODUCT SLICE
**Current accepted implementation slice.**

First finding and minimal fix:
- The existing proxy protected Admin APIs and some Admin pages.
- `/overview`, `/orders`, `/schools`, and `/customer-history` were outside the protected page matcher.
- The existing proxy was extended to protect those four Admin pages without changing the authentication architecture or business logic.

Implementation commit:
`67e9adaf32be65c4ce75f8253cb6d70fc05ee914`

The latest branch was pulled and production-built locally. TypeScript, static generation (**34/34 pages**), and final optimization passed. The Admin workspace was also manually tested and all eight sidebar items opened correctly. A non-blocking Turbopack warning remains about a package-lock file outside the repository root.

## Phase 9 — Production Deployment
**Status: NOT STARTED**

## Phase 10 — Real Business Pilot
**Status: NOT STARTED**

## Admin Workspace Acceptance
The Admin workspace uses one persistent sidebar and one main content area. Overview is the default view. The accepted top-level navigation is:

- Overview
- Inventory
- Orders
- Customers
- Products
- Payments
- Supply
- Reports

Inventory opens the inventory main view. Products opens Classes & Assessment Books. Payments and Reports reuse existing order/payment/supply data without introducing a new dashboard or payment-processing logic.

## Current Position
Phase 8 is current and the remaining work is security/testing/hardening only. The Admin, Customer, and Supply Person product slice is accepted at the agreed boundary. Phase 7 and all earlier completed phases remain protected.

## Next Work Rule
Continue the remaining Phase 8 security/testing/hardening slices explicitly. Do not add product features while this hardening checkpoint remains open.

Do not jump to Phase 9 because it appears useful. Do not reopen completed phases without an explicit change request and impact review.

## Documentation Rule
Any accepted change must update the relevant project documentation and create a stable Git checkpoint.
