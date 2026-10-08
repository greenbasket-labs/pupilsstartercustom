create table if not exists public.admin_authorized_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_authorized_emails enable row level security;
revoke all on table public.admin_authorized_emails from public, anon, authenticated;
grant select on table public.admin_authorized_emails to service_role;

create index if not exists admin_authorized_emails_active_idx
  on public.admin_authorized_emails (is_active);

comment on table public.admin_authorized_emails is
  'Server-controlled list of email addresses authorized for the PUPILS START admin workspace.';
