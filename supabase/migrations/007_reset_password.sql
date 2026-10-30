-- Tokens de restablecimiento de contraseña (solo clientes de la tienda).
-- Se guarda el hash SHA-256 del token; el valor en claro solo va en el enlace del correo.

create table if not exists public.reset_password_tokens (
  token_hash text primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  expira_en timestamptz not null,
  usado_en timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists reset_password_tokens_cliente_idx
  on public.reset_password_tokens (cliente_id);

alter table public.reset_password_tokens enable row level security;
