-- Phase 4 — Admin authorization foundation
create extension if not exists pgcrypto;

create table if not exists public.admin_authorized_phones (
  id uuid primary key default gen_random_uuid(),
  phone_e164 text not null unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_authorized_phones enable row level security;
revoke all on table public.admin_authorized_phones from public, anon, authenticated;

create index if not exists admin_authorized_phones_active_idx
  on public.admin_authorized_phones (is_active);

comment on table public.admin_authorized_phones is
  'Server-controlled list of phone numbers authorized for the PUPILS START admin workspace.';
