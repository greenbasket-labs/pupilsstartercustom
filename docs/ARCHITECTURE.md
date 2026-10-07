# Architecture

## Initial Direction
A modern web platform with clear separation between:
- Customer experience
- Admin workspace
- Supply-person workspace
- Application/business logic
- Database
- Payment provider
- Notifications
- Audit/history

## Initial Technology Direction
Recommended, pending implementation confirmation:
- Web application: Next.js + TypeScript
- Database/authentication: Supabase/PostgreSQL
- Payments: Paystack
- Hosting: Vercel
- Transactional email: Resend
- Source control: GitHub

## Core Domains
Keep these concepts separate:
- Users and roles
- Customers/schools
- Products
- Classes/categories
- Inventory
- Stock movements
- Orders
- Order items
- Payments
- Supply assignments
- Supply persons
- Delivery records
- Audit logs

## State Separation
Payment state and supply state are independent.

Payment:
`Pending → Paid / Failed / Refunded`

Supply:
`Pending → Assigned → Supplied`

## Data Integrity
The database is the source of truth for prices, stock, orders, payment state, supply assignments, and permissions. The browser must not be trusted to determine financial or inventory truth.

## Critical Transactions
Payment confirmation, order creation, and inventory changes must be designed so partial failures do not leave inconsistent business state.

## Roles
### Admin
Full operational control.

### Customer
Public ordering and access to applicable order information.

### Supply Person
Restricted access to assigned orders and delivery confirmation.

## UI Principle
Keep the interface clean and modern. Admin functionality should use grouped/dropdown navigation rather than scattering every function across the main dashboard.

## Architecture Rule
Do not introduce microservices or unnecessary infrastructure for Version 1. Prefer a modular monolith with clear domain boundaries unless scale or a concrete requirement justifies a different architecture.
