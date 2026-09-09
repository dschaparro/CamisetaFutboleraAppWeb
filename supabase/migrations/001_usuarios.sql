create extension if not exists "pgcrypto";

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('Administrador', 'Vendedor')),
  password_hash text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.usuarios enable row level security;
