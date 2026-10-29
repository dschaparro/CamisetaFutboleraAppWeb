-- Cantidad máxima por producto parametrizable (default 5, techo DB 20).

alter table public.tienda_ajustes
  add column if not exists carrito_max_cantidad int not null default 5
    check (carrito_max_cantidad >= 1 and carrito_max_cantidad <= 20);

update public.carrito_items set cantidad = 20 where cantidad > 20;

alter table public.carrito_items drop constraint if exists carrito_items_cantidad_check;
alter table public.carrito_items
  add constraint carrito_items_cantidad_check check (cantidad >= 1 and cantidad <= 20);
