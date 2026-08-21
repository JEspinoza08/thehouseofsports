-- ============================================================
-- THS - Mejoras de catálogo, banners, categorías y personalización
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Es una migración aditiva: no elimina datos existentes.
-- ============================================================

-- 1) PRODUCTOS: habilitar personalización
alter table public.products
  add column if not exists personalization_enabled boolean not null default false;

-- 2) VARIANTES: una fila representa una combinación color + talla/número
alter table public.product_variants
  add column if not exists color_name text,
  add column if not exists color_hex text;

create index if not exists product_variants_color_idx
  on public.product_variants(product_id, color_name);

-- 3) GALERÍA DE IMÁGENES POR PRODUCTO
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_idx
  on public.product_images(product_id, sort_order);

alter table public.product_images enable row level security;

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.is_active = true
  )
  or exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true
  )
);

drop policy if exists "Admins manage product images" on public.product_images;
create policy "Admins manage product images"
on public.product_images for all
to authenticated
using (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
)
with check (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

-- Copiar la imagen principal histórica a la galería cuando todavía no exista.
insert into public.product_images (product_id, image_url, sort_order, is_primary)
select p.id, p.image_url, 0, true
from public.products p
where nullif(trim(p.image_url), '') is not null
  and not exists (select 1 from public.product_images pi where pi.product_id = p.id);

-- 4) OPCIONES DE PERSONALIZACIÓN
create table if not exists public.product_customization_options (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products(id) on delete cascade,
  label text not null,
  description text,
  price numeric(10,2) not null default 0 check (price >= 0),
  requires_text boolean not null default false,
  requires_number boolean not null default false,
  requires_flag boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_customization_product_idx
  on public.product_customization_options(product_id, sort_order);

alter table public.product_customization_options enable row level security;

drop policy if exists "Public can read customization options" on public.product_customization_options;
create policy "Public can read customization options"
on public.product_customization_options for select
to anon, authenticated
using (
  is_active = true
  and exists (
    select 1 from public.products p
    where p.id = product_customization_options.product_id and p.is_active = true
  )
  or exists (
    select 1 from public.profiles pr
    where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true
  )
);

drop policy if exists "Admins manage customization options" on public.product_customization_options;
create policy "Admins manage customization options"
on public.product_customization_options for all
to authenticated
using (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
)
with check (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

-- 5) CATEGORÍAS ADMINISTRABLES
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  is_active boolean not null default true,
  show_home boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (name, slug, sort_order)
values
  ('Guantes', 'guantes', 10),
  ('Zapatillas', 'zapatillas', 20),
  ('Bolsos y Mochilas', 'bolsos', 30),
  ('Accesorios', 'accesorios', 40),
  ('Ropa', 'ropa', 50),
  ('Ofertas', 'ofertas', 60)
on conflict (slug) do nothing;

alter table public.categories enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (
  is_active = true
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories for all
to authenticated
using (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
)
with check (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

-- 6) BANNERS WEB + MOBILE
create table if not exists public.hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  desktop_image_url text not null,
  mobile_image_url text not null,
  target_url text,
  brand_filter text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hero_banners enable row level security;

drop policy if exists "Public can read hero banners" on public.hero_banners;
create policy "Public can read hero banners"
on public.hero_banners for select
to anon, authenticated
using (
  is_active = true
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

drop policy if exists "Admins manage hero banners" on public.hero_banners;
create policy "Admins manage hero banners"
on public.hero_banners for all
to authenticated
using (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
)
with check (
  exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

-- 7) DETALLE DE PERSONALIZACIÓN DE CADA ÍTEM VENDIDO
-- Se guarda aparte para no romper la función create_complete_order ya existente.
create table if not exists public.order_item_customizations (
  id uuid primary key default gen_random_uuid(),
  order_item_id text not null unique,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  option_id uuid references public.product_customization_options(id) on delete set null,
  option_label text not null,
  surcharge numeric(10,2) not null default 0,
  custom_text text,
  custom_number text,
  flag_type text,
  flag_value text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists order_item_customizations_order_idx
  on public.order_item_customizations(order_id);

alter table public.order_item_customizations enable row level security;

drop policy if exists "Users read own customizations" on public.order_item_customizations;
create policy "Users read own customizations"
on public.order_item_customizations for select
to authenticated
using (
  exists (select 1 from public.orders o where o.id = order_item_customizations.order_id and o.user_id = auth.uid())
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

drop policy if exists "Users insert own customizations" on public.order_item_customizations;
create policy "Users insert own customizations"
on public.order_item_customizations for insert
to authenticated
with check (
  exists (select 1 from public.orders o where o.id = order_item_customizations.order_id and o.user_id = auth.uid())
);

-- 8) Permitir lectura pública de variantes activas, si no existiera ya una política compatible.
-- No eliminamos políticas existentes; esta solo amplía SELECT.
drop policy if exists "Public can read active product variants" on public.product_variants;
create policy "Public can read active product variants"
on public.product_variants for select
to anon, authenticated
using (
  is_active = true
  and exists (select 1 from public.products p where p.id = product_variants.product_id and p.is_active = true)
  or exists (select 1 from public.profiles pr where pr.id = auth.uid() and pr.role = 'admin' and coalesce(pr.is_active, true) = true)
);

-- Nota: los archivos de banners/categorías/productos se seguirán subiendo al bucket
-- Storage "productos" que el proyecto ya utiliza. No es necesario crear otro bucket.
