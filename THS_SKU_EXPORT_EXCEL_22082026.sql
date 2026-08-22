-- THS - Código SKU por producto
-- Ejecutar una sola vez en Supabase > SQL Editor antes de usar la nueva vista admin.

alter table public.products
  add column if not exists sku_code text;

-- Normaliza vacíos a NULL para que no choquen con el índice único.
update public.products
set sku_code = null
where sku_code is not null and btrim(sku_code) = '';

-- Un mismo SKU no puede pertenecer a dos productos diferentes.
create unique index if not exists products_sku_code_unique_idx
  on public.products (upper(sku_code))
  where sku_code is not null and btrim(sku_code) <> '';

comment on column public.products.sku_code is
  'Código SKU interno/comercial del producto. Se administra desde Gestión de productos.';
