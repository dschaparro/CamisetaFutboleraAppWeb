-- Tope de productos distintos en carrito: 20 (antes 5). Cantidad por línea: máx. 5.

alter table public.tienda_ajustes
  alter column carrito_max_productos set default 20;

update public.tienda_ajustes
set carrito_max_productos = 20, actualizado_en = now()
where id = 1 and carrito_max_productos = 5;

update public.carrito_items set cantidad = 5 where cantidad > 5;

alter table public.carrito_items drop constraint if exists carrito_items_cantidad_check;
alter table public.carrito_items
  add constraint carrito_items_cantidad_check check (cantidad >= 1 and cantidad <= 5);
