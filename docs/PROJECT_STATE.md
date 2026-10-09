# Project State

## Current Phase
**Phase 8 — Security, Testing & Hardening**

## Status
**CURRENT — PHASE 8 SECURITY / HARDENING ONLY**

## Repository
- GitHub: `greenbasket-labs/pupilsstartercustom`
- Default branch: `main`
- Technology/development partner: Green Basket Global Ltd.

## Accepted Phase Results

### Phase 0 — Foundation & Engineering Rules
**COMPLETE**

Project documentation, engineering rules, business rules, architecture boundaries, safe-change rules, handover rules, and source-code ownership boundaries are established.

### Phase 1 — Product, Classes & Pricing
**COMPLETE & FROZEN**

Catalogue creation, editing, activation/deactivation, pricing, class/product relationships, safe editing against inactive classes, and removal rules were manually accepted.

### Phase 2 — Inventory & Incoming Stock
**COMPLETE & FROZEN**

The inventory ledger, available/incoming/projected stock calculations, incoming receipts, negative-stock protection, and history preservation were manually accepted.

### Phase 3 — Customer Ordering
**COMPLETE & FROZEN**

Public ordering, customer information capture, order references, item/quantity capture, and the rule that unpaid/unverified orders do not consume stock were manually accepted.

### Phase 4 — Payment Integration
**COMPLETE & FROZEN**

Manually accepted:
- Paystack server-side transaction initialization.
- Server-side transaction verification.
- Successful test checkout and callback.
- Signed `charge.success` webhook handling.
- Invalid-signature rejection.
- Idempotent webhook replay handling.
- Exactly-once purchase movement creation for the accepted test order.
- Verified-payment stock reduction.
- Unpaid orders do not consume stock.
- Insufficient remaining stock blocks a later order.

Deferred deployment/authentication follow-ups do not reopen Phase 4.

### Phase 5 — Supply Persons & Delivery
**COMPLETE & FROZEN**

Supply-person creation, restricted assigned-order access, delivery-code confirmation, and delivery completion were manually accepted.

### Phase 6 — Customer & Order History
**COMPLETE & FROZEN**

Read-only Customer History, Schools view, customer-specific history, and payment/supply history were manually accepted.

### Phase 7 — Admin Dashboard & Business Visibility
**COMPLETE FOR ACCEPTED FIRST SLICE — FROZEN**

The accepted Admin Overview remains protected. Its metrics, layout, navigation placement, names, and behavior are not changed by Phase 8.

## Phase 8 — Security, Testing & Hardening
**CURRENT — PHASE 8 SECURITY / HARDENING**

Phase 8 scope:
- Authorization review.
- Critical workflow tests.
- Audit logging.
- Error handling.
- Backup/recovery verification.
- Performance/security review.

### Phase 8 Security / Hardening Status

The agreed Admin, Customer, and Supply Person product slice is now manually acceptance-tested and considered complete for this checkpoint. No new product functionality is being added while Phase 8 security/hardening is completed.

Remaining controlled security/hardening work:
- Critical workflow automated tests.
- Audit logging review/implementation.
- Error-handling hardening.
- Backup/recovery verification.
- Supabase security/advisor review, including RLS access boundaries and Auth security settings.
- Performance/security review — advisor review completed; the `order_items(order_id)` foreign-key index was added and verified.
- Supply Person 4–6 digit PIN and approved-device binding, when explicitly taken as the next security slice.

### Performance / Security Review

The missing `order_items(order_id)` foreign-key index was added and verified. Performance Advisor was rerun and the unindexed-foreign-key finding is cleared. Remaining unused-index findings are INFO-level and were reviewed without speculative removals.

### Authorization Review

The first review identified a concrete authorization boundary gap:

- Server proxy authorization already protected the Admin root, `/supply-admin`, and `/api/admin/*`.
- The Admin pages `/overview`, `/orders`, `/schools`, and `/customer-history` were not included in the protected page matcher.
- Those pages consume protected Admin APIs and therefore should not be directly reachable without the Admin authorization boundary.

A minimal fix was implemented on branch `phase8-security-authorization`:

- Expanded the existing proxy protected-page set to include those four Admin pages.
- Expanded the existing proxy matcher to cover the same four pages.
- No authentication architecture was changed.
- No database, payment, inventory, supply, order, or Admin Overview business logic was changed.

Implementation commit:
`67e9adaf32be65c4ce75f8253cb6d70fc05ee914`

### Validation status

The latest Admin workspace branch was pulled and production-built locally after the workspace changes.

- TypeScript: **PASS**
- Static page generation: **34/34 PASS**
- Final optimization: **PASS**
- Admin sidebar/manual workspace navigation: **PASS**

The only remaining build message is a non-blocking Turbopack warning about a package-lock file outside the repository root. No build failure is present.

## Protected Dashboard Boundary
PUPILS START has exactly three dashboards:
1. **Admin dashboard** — business operations.
2. **Client dashboard** — school/customer ordering and history.
3. **Supply Person dashboard** — assigned supply and delivery actions.

No fourth dashboard is to be introduced without an explicit business decision.

## Protected Rules
- The accepted Admin Overview remains frozen.
- Completed phases remain protected unless explicitly reopened.
- Payment and physical supply remain independent.
- Stock must only change through traceable movements.
- Repeated payment-provider events must not create duplicate purchase movements.
- Orders, payments, stock movements, supply history, and audit history must be preserved.
- Service-role and payment secrets must never reach the browser or Git.
- Server-side authorization remains mandatory.

## Not Yet Implemented
- Critical workflow automated tests.
- Audit logging review/implementation.
- Error-handling hardening.
- Backup/recovery verification.
- Remaining security/hardening follow-ups after the completed performance/security advisor review.
- Phase 9 — Production Deployment.
- Phase 10 — Real Business Pilot.

## Admin Workspace Acceptance

The Admin workspace now has one persistent sidebar and one main content area. Overview is the default view. The accepted sidebar items are:

- Overview
- Inventory
- Orders
- Customers
- Products
- Payments
- Supply
- Reports

Inventory opens the inventory main view. Products opens Classes & Assessment Books. Payments and Reports reuse existing order/payment/supply data and do not introduce a new dashboard or duplicate payment-processing logic.

The workspace was manually tested after the latest build and all eight sidebar items opened correctly.

## Current Next Task
Continue the remaining controlled Phase 8 security/testing/hardening work only. The Admin, Customer, and Supply Person product-surface cleanup is accepted for this checkpoint.

Do not modify the accepted Admin Overview or reopen completed phases speculatively.

## Handover Rule
Any new AI/developer session must read `README.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ENGINEERING_RULES.md`, `docs/BUSINESS_RULES.md`, and `docs/ARCHITECTURE.md` before changing the repository.
