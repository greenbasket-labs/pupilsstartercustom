# Project State

## Current Phase
**Phase 2 — Inventory & Incoming Stock**

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

## Current Phase Goal
Complete the controlled inventory foundation: available stock, incoming stock, traceable movements, safe calculations, and the business rules that will later connect verified purchases to automatic stock reduction.

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

## Current Phase Acceptance Boundary

Phase 2 has started, but the inventory foundation is **not yet accepted as complete**. Local lint/build validation and manual inventory acceptance are still required before this slice becomes a stable checkpoint.

## Protected Rules
- Preserve completed Phase 0 documentation unless an explicit change request reopens it.
- Do not build inventory, customer ordering, payment, or supply workflows ahead of the roadmap.
- Do not add unrelated features during Phase 1.
- Do not hard-code business classes or products into application pages.

## Next Task
Continue Phase 2 inventory acceptance and validation. Do not begin Phase 3 customer ordering, Phase 4 payment, or later workflows ahead of the roadmap.

## Last Known Stable State
Phase 1 stable checkpoint: `b6ef077 — fix: preserve class access while editing products`

Current Phase 2 work is not yet a stable checkpoint.

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
