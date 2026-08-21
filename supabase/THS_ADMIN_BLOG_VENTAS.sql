-- Ejecutar en Supabase SQL Editor para habilitar blog, dashboard y ventas presenciales THS.

-- 1) BLOG
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  cover_image_url text,
  category text not null default 'Novedades',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
drop policy if exists "Public reads published blog" on public.blog_posts;
create policy "Public reads published blog" on public.blog_posts for select using (status = 'published' or auth.role() = 'authenticated');
drop policy if exists "Authenticated manages blog" on public.blog_posts;
create policy "Authenticated manages blog" on public.blog_posts for all to authenticated using (true) with check (true);
create index if not exists blog_posts_status_published_idx on public.blog_posts(status, published_at desc);

-- Bucket público para portadas del blog
insert into storage.buckets (id, name, public) values ('blog-images','blog-images',true) on conflict (id) do update set public = true;
drop policy if exists "Public reads blog images" on storage.objects;
create policy "Public reads blog images" on storage.objects for select using (bucket_id = 'blog-images');
drop policy if exists "Authenticated uploads blog images" on storage.objects;
create policy "Authenticated uploads blog images" on storage.objects for insert to authenticated with check (bucket_id = 'blog-images');
drop policy if exists "Authenticated updates blog images" on storage.objects;
create policy "Authenticated updates blog images" on storage.objects for update to authenticated using (bucket_id = 'blog-images') with check (bucket_id = 'blog-images');
drop policy if exists "Authenticated deletes blog images" on storage.objects;
create policy "Authenticated deletes blog images" on storage.objects for delete to authenticated using (bucket_id = 'blog-images');


-- 2) CANAL DE VENTA EN PEDIDOS
alter table public.orders add column if not exists sales_channel text not null default 'online' check (sales_channel in ('online','store'));
alter table public.orders add column if not exists internal_notes text;

-- 3) RPC ATÓMICA PARA VENTA PRESENCIAL + DESCUENTO DE STOCK
create or replace function public.register_manual_sale(
  p_customer_name text,
  p_payment_method text,
  p_notes text,
  p_items jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_item jsonb;
  v_total numeric := 0;
  v_product_id bigint;
  v_qty integer;
  v_price numeric;
  v_stock integer;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'La venta no tiene productos'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, (v_item->>'quantity')::integer);
    v_price := (v_item->>'unit_price')::numeric;
    v_total := v_total + (v_qty * v_price);
  end loop;

  insert into public.orders (
    user_id, customer_name, customer_dni, customer_phone, customer_address,
    customer_department, customer_province, customer_district, customer_reference,
    customer_zone, payment_method, payment_status, paid_at, subtotal, shipping_cost,
    total, status, sales_channel, internal_notes
  ) values (
    auth.uid(), coalesce(nullif(trim(p_customer_name),''),'Cliente tienda'), '00000000', '-', 'Venta presencial',
    'Lima', 'Lima', 'Tienda física', null, 'Lima', p_payment_method, 'paid', now(), v_total, 0,
    v_total, 'entregado', 'store', p_notes
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_qty := greatest(1, (v_item->>'quantity')::integer);
    v_price := (v_item->>'unit_price')::numeric;

    if nullif(v_item->>'variant_id','') is not null then
      select stock into v_stock from public.product_variants where id::text = (v_item->>'variant_id') for update;
      if coalesce(v_stock,0) < v_qty then raise exception 'Stock insuficiente para variante %', v_item->>'variant_value'; end if;
      update public.product_variants set stock = stock - v_qty where id::text = (v_item->>'variant_id');
      update public.products set stock = greatest(0, stock - v_qty), updated_at = now() where id = v_product_id;
    else
      select stock into v_stock from public.products where id = v_product_id for update;
      if coalesce(v_stock,0) < v_qty then raise exception 'Stock insuficiente para %', v_item->>'product_name'; end if;
      update public.products set stock = stock - v_qty, updated_at = now() where id = v_product_id;
    end if;

    insert into public.order_items (
      order_id, product_id, product_name, quantity, unit_price, subtotal,
      variant_id, variant_type, variant_value
    ) values (
      v_order_id, v_product_id, v_item->>'product_name', v_qty, v_price, v_qty*v_price,
      (select id from public.product_variants where id::text = nullif(v_item->>'variant_id','') limit 1), nullif(v_item->>'variant_type',''), nullif(v_item->>'variant_value','')
    );
  end loop;

  return v_order_id;
end;
$$;
grant execute on function public.register_manual_sale(text,text,text,jsonb) to authenticated;
