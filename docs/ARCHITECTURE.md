# Architecture

## Confirmed Initial Stack

- Web application: **Next.js + TypeScript**
- Database/authentication: **Supabase/PostgreSQL**
- Payments: **Paystack**
- Hosting: **Vercel**
- Transactional email: **Resend**
- Source control: **GitHub**

The stack is intentionally simple for Version 1. It can scale without introducing unnecessary infrastructure.

## Application Shape
Prefer a modular monolith with clear domain boundaries.

Initial application areas:
- Public customer experience
- Admin workspace
- Supply-person workspace
- Shared business/domain logic

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
Do not introduce microservices or unnecessary infrastructure for Version 1. New infrastructure requires a concrete business or technical reason and explicit approval.
