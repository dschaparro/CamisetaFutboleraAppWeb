-- Esquema de Camiseta Futbolera, hecho a la medida de la app (reemplaza la simulación en memoria).
-- Solo el servidor de Next.js accede (conexión PostgreSQL); RLS activo sin políticas bloquea
-- cualquier acceso desde la API pública de Supabase.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================ Cuentas ============================

-- Personal del panel.
create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null,
  rol text not null check (rol in ('Administrador', 'Vendedor', 'Bodega', 'Marketing')),
  password_hash text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clientes de la tienda en línea.
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null,
  telefono text,
  password_hash text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.direcciones (
  id text primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  alias text not null,
  destinatario text not null,
  telefono text not null,
  direccion text not null,
  ciudad text not null,
  indicaciones text not null default '',
  predeterminada boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists direcciones_cliente_idx on public.direcciones (cliente_id);

-- Tarjetas guardadas: nunca el número completo ni el CVC.
create table if not exists public.tarjetas_guardadas (
  id text primary key,
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  marca text not null,
  ultimos4 text not null check (ultimos4 ~ '^[0-9]{4}$'),
  vencimiento text not null check (vencimiento ~ '^[0-9]{2}/[0-9]{2}$'),
  titular text not null,
  predeterminada boolean not null default false,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tarjetas_cliente_idx on public.tarjetas_guardadas (cliente_id);

-- ============================ Tienda ============================

create table if not exists public.ligas (
  id text primary key,
  nombre text not null,
  pais text not null,
  descripcion text not null default '',
  color1 text not null,
  color2 text not null,
  imagen text,
  posicion text not null default 'center',
  orden int not null default 0,
  visible boolean not null default true
);

-- id = slug de la URL (/producto/<id>) y base del SKU (CF-<id>).
create table if not exists public.productos (
  id text primary key,
  nombre text not null,
  club text not null,
  liga_id text not null references public.ligas (id),
  categoria text not null check (categoria in ('europeo', 'colombiano', 'seleccion')),
  precio int not null check (precio > 0),
  costo int check (costo >= 0),
  stock int not null default 0 check (stock >= 0),
  iniciales text not null,
  personalizable boolean not null default true,
  retro boolean not null default false,
  etiqueta text check (etiqueta in ('Nuevo', 'Retro')),
  descripcion text not null default '',
  escudo text,
  -- Fotos: ids de imágenes subidas (img-…) o URLs https; la primera es la principal.
  imagenes text[] not null default '{}',
  posicion_imagen text not null default 'center',
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists productos_liga_idx on public.productos (liga_id);

-- Imágenes subidas desde el panel (luego se pueden mover a Supabase Storage).
create table if not exists public.imagenes (
  id text primary key,
  tipo text not null check (tipo in ('image/png', 'image/jpeg', 'image/webp')),
  datos bytea not null,
  created_at timestamptz not null default now()
);

create table if not exists public.promociones (
  id text primary key,
  etiqueta text not null,
  porcentaje int not null check (porcentaje between 1 and 90),
  alcance text not null check (alcance in ('productos', 'liga', 'todo')),
  producto_ids text[] not null default '{}',
  liga_id text references public.ligas (id) on delete set null,
  desde timestamptz not null,
  hasta timestamptz not null,
  activa boolean not null default true,
  check (hasta > desde)
);

create table if not exists public.cupones (
  id text primary key,
  codigo text not null unique,
  tipo text not null check (tipo in ('porcentaje', 'valor')),
  valor int not null check (valor > 0),
  minimo_compra int not null default 0,
  hasta timestamptz not null,
  usos_maximos int check (usos_maximos > 0),
  usos int not null default 0,
  activo boolean not null default true
);

create table if not exists public.banners (
  id text primary key,
  antetitulo text not null default '',
  titulo text not null,
  texto text not null default '',
  boton text not null,
  enlace text not null,
  color1 text not null,
  color2 text not null,
  acento text not null,
  insignia text not null default '',
  imagen text,
  posicion text not null default 'center',
  oscurecer int not null default 55 check (oscurecer between 0 and 90),
  alineacion text not null default 'izquierda' check (alineacion in ('izquierda', 'centro')),
  orden int not null default 0,
  desde timestamptz not null,
  hasta timestamptz not null,
  activo boolean not null default true
);

-- ============================ Pedidos ============================

-- Numeración CF-00001… (continúa la de los pedidos de ejemplo).
create sequence if not exists public.pedido_numero start 1;

create table if not exists public.pedidos (
  id text primary key,
  cliente_id uuid references public.clientes (id) on delete set null,
  clave_acceso text not null,
  contacto_nombre text not null,
  contacto_email text not null,
  contacto_telefono text not null,
  creado_en timestamptz not null default now(),
  estado text not null check (estado in ('Pendiente de pago', 'Alistamiento', 'Enviado', 'Entregado', 'Cancelado')),
  medio_pago text not null,
  estado_pago text not null check (estado_pago in ('Pagado', 'Abono 50%', 'Pendiente')),
  ciudad text not null,
  direccion text not null,
  subtotal int not null,
  envio int not null,
  descuento int not null default 0,
  total int not null,
  guia text
);
create index if not exists pedidos_cliente_idx on public.pedidos (cliente_id);
create index if not exists pedidos_creado_idx on public.pedidos (creado_en desc);

create table if not exists public.pedido_items (
  id bigserial primary key,
  pedido_id text not null references public.pedidos (id) on delete cascade,
  orden int not null,
  nombre text not null,
  producto_id text,
  talla text not null,
  manga text not null,
  personalizacion text not null,
  cantidad int not null check (cantidad > 0),
  precio_unitario int not null check (precio_unitario >= 0)
);
create index if not exists pedido_items_pedido_idx on public.pedido_items (pedido_id);

create table if not exists public.pedido_historial (
  id bigserial primary key,
  pedido_id text not null references public.pedidos (id) on delete cascade,
  estado text not null,
  fecha timestamptz not null,
  nota text
);
create index if not exists pedido_historial_pedido_idx on public.pedido_historial (pedido_id);

-- ============================ Triggers y seguridad ============================

do $$
declare t text;
begin
  foreach t in array array['usuarios', 'clientes', 'productos'] loop
    execute format('drop trigger if exists %1$s_updated_at on public.%1$s', t);
    execute format('create trigger %1$s_updated_at before update on public.%1$s for each row execute function public.set_updated_at()', t);
  end loop;
  foreach t in array array['usuarios', 'clientes', 'direcciones', 'tarjetas_guardadas', 'ligas', 'productos', 'imagenes',
                           'promociones', 'cupones', 'banners', 'pedidos', 'pedido_items', 'pedido_historial'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
