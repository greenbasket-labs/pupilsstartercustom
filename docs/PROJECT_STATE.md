# Project State

## Current Phase
**Phase 8 — Security, Testing & Hardening**

## Status
**CURRENT — PHASE 8.1 AUTHORIZATION REVIEW IN PROGRESS**

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
**CURRENT — PHASE 8.1 AUTHORIZATION REVIEW IN PROGRESS**

Phase 8 scope:
- Authorization review.
- Critical workflow tests.
- Audit logging.
- Error handling.
- Backup/recovery verification.
- Performance/security review.

### Phase 8.1 — Authorization Review

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

Automated lint/build validation is **PENDING**.

The available execution environment could not resolve `github.com` when attempting to clone the repository for local validation. Therefore this milestone is not marked complete and no test pass is claimed.

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
- Performance/security review.
- Phase 9 — Production Deployment.
- Phase 10 — Real Business Pilot.

## Current Next Task
Complete validation of Phase 8.1, then continue with the next explicitly controlled Phase 8 slice.

Do not modify the accepted Admin Overview or reopen completed phases speculatively.

## Handover Rule
Any new AI/developer session must read `README.md`, `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ENGINEERING_RULES.md`, `docs/BUSINESS_RULES.md`, and `docs/ARCHITECTURE.md` before changing the repository.
