-- Operación del negocio: proveedor por producto, compras a proveedores, lista de compras
-- automática y datos de venta manual (canal y documento) en los pedidos.

alter table public.productos add column if not exists proveedor text not null default '';

alter table public.pedidos add column if not exists canal text not null default 'Web';
alter table public.pedidos add column if not exists documento text;

-- Compras a proveedores: cada una suma stock y actualiza el costo del producto.
create table if not exists public.compras (
  id bigserial primary key,
  producto_id text references public.productos (id) on delete set null,
  producto text not null,
  proveedor text not null,
  cantidad int not null check (cantidad > 0),
  costo_unitario int not null check (costo_unitario >= 0),
  nota text not null default '',
  creada_en timestamptz not null default now()
);
create index if not exists compras_creada_idx on public.compras (creada_en desc);

-- Lo que hay que conseguir porque se vendió sin stock (ventas web y manuales).
create table if not exists public.lista_compras (
  id bigserial primary key,
  producto_id text references public.productos (id) on delete set null,
  producto text not null,
  variante text not null default '',
  personalizacion text not null default '',
  cantidad int not null default 1 check (cantidad > 0),
  origen text not null,
  pedido_id text references public.pedidos (id) on delete cascade,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Conseguido', 'No conseguido')),
  nota text,
  compra_id bigint references public.compras (id) on delete set null,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);
create index if not exists lista_compras_estado_idx on public.lista_compras (estado, creada_en);

alter table public.compras enable row level security;
alter table public.lista_compras enable row level security;
