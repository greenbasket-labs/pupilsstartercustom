# Project State

## Current Phase
**Phase 3 — Customer Ordering**

## Status
**IN PROGRESS**

## Repository
- GitHub: `greenbasket-labs/pupilsstartercustom`
- Default branch: `main`
- Technology/development partner: Green Basket Global Ltd.

## Phase 0 Result
Phase 0 — Foundation & Engineering Rules is **COMPLETE**.

Completed:
- Repository established.
- Project README established.
- Engineering rules established.
- Business rules established.
- Roadmap established.
- Architecture boundaries established.
- Safe-change and handover rules established.
- Source-code ownership rule established.

## Phase 2 Result
Phase 2 — Inventory & Incoming Stock is **COMPLETE**.

The controlled inventory foundation was implemented and manually accepted in the development browser. It remains frozen unless an explicit change request reopens it.

## Phase 1 Implementation Started
The web application now has a development administration screen for catalogue management.

Implemented:
- Admin can add classes.
- Admin can edit saved class names.
- Admin can edit saved assessment-book names, class associations, and selling prices.
- Class names are stored as data rather than hard-coded into the UI.
- Admin can activate/deactivate classes.
- Admin can remove classes that have no dependent products.
- Admin can add assessment books.
- Each assessment book is linked to a saved class.
- Admin can set the selling price.
- Admin can activate/deactivate products.
- Current development persistence uses browser storage as a temporary bridge.
- Production persistence remains planned for Supabase/PostgreSQL.

## Phase 1 Acceptance Checkpoint
The Phase 1 catalogue workflow has now passed manual acceptance testing in the development browser. The acceptance covered class and assessment-book creation, editing, activation/deactivation, safe editing against inactive saved classes, removal rules, pricing persistence, and confirmation that catalogue data is not hard-coded.

## Stable Validation Checkpoint
Current stable commit:

`b6ef077 — fix: preserve class access while editing products`

Validation:
- Lint: **PASS**
- Build: **PASS**
- Working tree: **clean**
- Branch: `main`
- Remote: `origin/main`
- Local branch is synchronized with `origin/main`

The current checkpoint records the validated Phase 1 catalogue-editing state, including reachable Edit controls for classes and assessment books, with existing saved classes remaining selectable while editing a product even when those classes are inactive. Local validation was completed after pulling `main`: lint passed, build passed, and the working tree was clean. The existing browser-storage development bridge remains unchanged.

## Phase 2 Inventory Foundation

Implemented as the first controlled Phase 2 slice:

- Inventory is tied to saved assessment books/products.
- Stock movements are stored as a ledger rather than overwriting a stock number.
- Available stock is calculated from stock received, incoming stock received, and adjustments.
- Incoming stock is tracked separately from available stock.
- Projected stock is calculated as available plus incoming.
- Incoming stock can be moved into available stock only up to the recorded incoming quantity.
- Stock adjustments cannot reduce available stock below zero.
- Product removal is blocked once stock history exists, preserving inventory history.
- Verified customer purchases will later reduce available stock automatically through the order/payment flow, with the inventory movement linked to the payment/order history.
- Checkout or unverified payment must not reduce stock.
- Admin may manually reduce stock for non-sale reasons, with a required reason/note recorded in inventory history.
- Repeated payment-provider events must not reduce the same order's stock more than once.
- The current development implementation uses browser storage as a temporary bridge; production inventory truth will move to Supabase/PostgreSQL.
- No payment, ordering, supply, or later-phase workflow has been introduced.

## Phase 2 Acceptance Result
Manual acceptance completed successfully in the development browser:

- Stock received: PASS
- Incoming stock: PASS
- Receive incoming limited by recorded incoming quantity: PASS
- Available/incoming/projected calculations: PASS
- Stock adjustment cannot reduce available stock below zero: PASS
- Product removal blocked when stock history exists: PASS
- Inventory history remains traceable: PASS
- Purchase-linked stock rules documented for the later order/payment flow: PASS

Local validation completed after pulling `main`:
- Lint: PASS
- Build: PASS
- TypeScript/build generation: PASS

Phase 2 is frozen at this acceptance boundary. Future work must proceed from the next roadmap phase rather than reopening Phase 2 without an explicit change request.

## Phase 3 Customer Ordering Foundation
Implemented as the first controlled Phase 3 slice:

- Public customer ordering page at `/order`.
- Customer can browse active classes/products and configured available stock.
- Customer can select assessment books and quantities.
- Customer can build a multi-item order.
- Customer enters school name, contact name, phone number, and optional email.
- Order is assigned a customer-facing reference.
- Order records preserve product name, class, unit price, quantity, line total, and order total at creation time.
- Initial order state is Payment: Pending and Supply: Pending Supply.
- Customer receives an order confirmation screen with the reference and total.
- The current development implementation stores orders in browser storage as a temporary bridge.
- Creating an order does **not** reduce inventory and does not process payment.
- Verified-payment stock reduction remains a later order/payment workflow requirement.

## Phase 3 Acceptance Boundary
Phase 3 is **IN PROGRESS**. The initial customer-ordering foundation is implemented but not yet manually accepted. Local lint/build validation and browser acceptance are required before Phase 3 can become a stable checkpoint.

## Protected Rules
- Preserve completed Phase 0 documentation unless an explicit change request reopens it.
- Preserve completed Phase 1 catalogue functionality unless an explicit change request reopens it.
- Preserve completed Phase 2 inventory functionality unless an explicit change request reopens it.
- Do not build payment, supply, or later workflows ahead of the roadmap.
- Do not hard-code business classes or products into application pages.

## Next Task
Manually test the Phase 3 customer ordering foundation, then run lint/build and record a stable checkpoint if all acceptance criteria pass. Do not begin Phase 4 payment ahead of Phase 3 acceptance.

## Last Known Stable State
Phase 2 stable checkpoint: `95bd61349c03bbdcc8e5e2e6cd327ef0f9394ba4 — docs: record stable Phase 2 checkpoint`

## Phase 1 Manual Acceptance Result
Manual acceptance testing completed successfully in the development browser:

- Class add/edit/activate/deactivate/remove: PASS
- Assessment-book add/edit/activate/deactivate/remove: PASS
- Product class association and price editing: PASS
- Existing inactive class remains selectable while editing a linked product: PASS
- Dependent-class removal protection: PASS
- Catalogue is data-driven rather than hard-coded: PASS
- Browser persistence development bridge: PASS

Phase 1 is frozen at this acceptance boundary. Future work should proceed from the next roadmap phase rather than reopening completed catalogue work without an explicit change request.

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
