-- Ajustes de experiencia de la tienda (una sola fila).

create table if not exists public.tienda_ajustes (
  id smallint primary key default 1 check (id = 1),
  carrito_max_productos int not null default 20 check (carrito_max_productos >= 1 and carrito_max_productos <= 50),
  actualizado_en timestamptz not null default now()
);

insert into public.tienda_ajustes (id, carrito_max_productos)
values (1, 20)
on conflict (id) do nothing;

alter table public.tienda_ajustes enable row level security;
