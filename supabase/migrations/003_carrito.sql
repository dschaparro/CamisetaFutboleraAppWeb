-- Carrito persistente por cliente de tienda (pre-checkout).

create table if not exists public.carrito_items (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  slug text not null,
  talla text not null,
  manga text not null,
  personalizacion text not null,
  cantidad int not null check (cantidad >= 1 and cantidad <= 5),
  club text not null default '',
  nombre text not null,
  initials text not null default '',
  cat text not null default '',
  precio int not null check (precio >= 0),
  actualizado_en timestamptz not null default now(),
  unique (cliente_id, slug, talla, manga, personalizacion)
);

create index if not exists carrito_items_cliente_idx on public.carrito_items (cliente_id);

alter table public.carrito_items enable row level security;
