-- Phase 4A — Production catalogue and inventory foundation
-- Catalogue and inventory become database-controlled before payment integration.
-- No direct browser/client CRUD policies are created; server-side code will control writes.

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  name text not null,
  price_kobo bigint not null check (price_kobo > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, name)
);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  kind text not null
    check (kind in ('received', 'incoming', 'incoming_received', 'adjustment', 'purchase')),
  quantity integer not null check (quantity <> 0),
  note text,
  order_id uuid references public.orders(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    (kind in ('received', 'incoming', 'incoming_received', 'purchase') and quantity > 0)
    or
    (kind = 'adjustment' and quantity <> 0)
  ),
  check (
    (kind = 'purchase' and order_id is not null)
    or
    (kind <> 'purchase')
  ),
  check (
    (kind = 'adjustment' and nullif(trim(note), '') is not null)
    or
    kind <> 'adjustment'
  )
);

create index if not exists products_class_id_idx
  on public.products(class_id);

create index if not exists products_active_idx
  on public.products(is_active);

create index if not exists stock_movements_product_id_idx
  on public.stock_movements(product_id);

create index if not exists stock_movements_order_id_idx
  on public.stock_movements(order_id);

create unique index if not exists stock_movements_purchase_order_product_unique
  on public.stock_movements(order_id, product_id)
  where kind = 'purchase';

alter table public.classes enable row level security;
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

-- No direct public/client CRUD policies are created.
-- Server-side application code will enforce catalogue and inventory business rules.

comment on table public.classes is
  'Business-managed assessment classes; not application constants.';

comment on table public.products is
  'Business-managed assessment books and selling prices.';

comment on table public.stock_movements is
  'Traceable inventory ledger. Verified purchases are linked to orders and protected against duplicate purchase movements.';
