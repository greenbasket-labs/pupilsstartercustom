# Engineering Rules

## 1. Source of Truth
The Git repository and its documentation are the source of truth. Chat conversations are working context only.

## 2. Safe Change Protocol
Every requested change must identify the task, current phase, scope, protected areas, expected result, acceptance criteria, and tests required.

## 3. Inspect Before Editing
Before a substantial change, inspect README.md, PROJECT_STATE.md, the roadmap, relevant source, tests, and database migrations.

## 4. Preserve Working Functionality
Do not refactor, redesign, rename, delete, or restructure unrelated working code.

## 5. No Silent Architecture Changes
Do not replace frameworks, database architecture, authentication, payment providers, deployment architecture, or major dependencies without explicit approval.

## 6. Business Rules Are Explicit
Important rules must be documented and represented in tests where practical.

## 7. Server-Side Security
Permissions and authorization must be enforced server-side. Hiding a UI button is not security.

## 8. Financial Integrity
Payment records must be verifiable and auditable. Confirmed financial records must not be silently overwritten.

## 9. Inventory Integrity
Stock changes must be represented by traceable stock movements. Critical stock/payment operations must be atomic.

## 10. Payment and Supply Are Separate
Paid does not mean supplied. Payment status and physical supply status remain independent.

## 11. Auditability
Important actions should record who performed them and when.

## 12. History Preservation
Orders, payments, stock movements, delivery records, and audit history should not be casually deleted.

## 13. Idempotency
External callbacks such as payment webhooks must be safe to process more than once.

## 14. Dependencies
Do not add, remove, upgrade, or replace dependencies without explicit approval or a clearly documented technical requirement.

## 15. Testing
Run relevant tests after every meaningful change. A feature is not complete if existing functionality is broken.

## 16. Git Checkpoints
Create a meaningful commit after each stable milestone. Create a checkpoint before risky changes.

## 17. Documentation
Update README.md, PROJECT_STATE.md, ROADMAP.md, or relevant documentation whenever the project state changes.

## 18. Environments
Keep development, staging, and production concerns separated as the project grows.

## 19. Secrets
Never commit passwords, private keys, payment secrets, service-role keys, or other credentials.

## 20. Small Changes
Prefer small, reviewable changes over large rewrites.

## 21. Stop on Regression
If a change breaks an existing feature, stop planned work and fix the regression before continuing.

## 22. New Chat / New Developer Rule
A new AI or developer session must read the repository documentation before modifying code.

## 23. Reusable Company Technology
Build reusable engineering foundations without mixing one customer's business data with another customer's product.

## 24. Definition of Done
A meaningful task is complete only when requested code is implemented, relevant tests pass, existing functionality remains intact, documentation is updated where required, and Git contains a stable checkpoint.
