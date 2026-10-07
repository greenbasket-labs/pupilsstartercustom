# Project State

## Current Phase
**Phase 1 — Product, Classes & Pricing**

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
Build the application foundation and the first business capability: product/class/pricing management.

## Phase 1 Implementation Started
The web application now has a development administration screen for catalogue management.

Implemented:
- Admin can add classes.
- Class names are stored as data rather than hard-coded into the UI.
- Admin can activate/deactivate classes.
- Admin can remove classes that have no dependent products.
- Admin can add assessment books.
- Each assessment book is linked to a saved class.
- Admin can set the selling price.
- Admin can activate/deactivate products.
- Current development persistence uses browser storage as a temporary bridge.
- Production persistence remains planned for Supabase/PostgreSQL.

## Stable Validation Checkpoint
Current stable commit:

`2fe2dfd — fix: replace effect-driven local storage state`

Validation:
- Lint: **PASS**
- Build: **PASS**
- Working tree: **clean**
- Branch: `main`
- Remote: `origin/main`
- Local branch is synchronized with `origin/main`

The `2fe2dfd` checkpoint replaced the effect-driven localStorage state initialization/persistence with a subscription-based approach using React's `useSyncExternalStore`, resolving the ESLint `react-hooks/set-state-in-effect` error while preserving the current Phase 1 browser-storage development bridge.

## Protected Rules
- Preserve completed Phase 0 documentation unless an explicit change request reopens it.
- Do not build inventory, customer ordering, payment, or supply workflows ahead of the roadmap.
- Do not add unrelated features during Phase 1.
- Do not hard-code business classes or products into application pages.

## Next Task
Continue Phase 1 with the required catalogue-management refinements and validation before moving to the next roadmap phase.

## Last Known Stable State
`2fe2dfd — fix: replace effect-driven local storage state`

## Handover Rule
Any new AI/developer session must read this file and the other project documentation before changing the repository.
