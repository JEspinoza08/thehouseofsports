-- THS · Clientes, empleados y ventas presenciales asociadas a cuenta
-- Ejecutar DESPUÉS de THS_ADMIN_BLOG_VENTAS.sql

-- 1) Perfiles: datos mínimos para CRM interno y roles.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'client',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists role text not null default 'client';
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Normaliza roles heredados del proyecto anterior.
update public.profiles set role = 'client' where role is null or role not in ('admin','client');
update public.profiles p
set email = u.email,
    full_name = coalesce(nullif(p.full_name,''), u.raw_user_meta_data->>'full_name'),
    phone = coalesce(nullif(p.phone,''), u.raw_user_meta_data->>'phone')
from auth.users u
where p.id = u.id;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_active_idx on public.profiles(is_active);
create unique index if not exists profiles_email_lower_idx on public.profiles(lower(email)) where email is not null;

-- 2) Venta presencial: ahora la orden pertenece al cliente seleccionado,
-- por lo que aparecerá en /mi-cuenta junto con sus pedidos web.
drop function if exists public.register_manual_sale(text,text,text,jsonb);
drop function if exists public.register_manual_sale(uuid,text,text,text,jsonb);

create or replace function public.register_manual_sale(
  p_customer_id uuid,
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
  v_customer_name text;
  v_customer_phone text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active = true) then
    raise exception 'No tienes permisos de administrador';
  end if;
  if p_customer_id is null then raise exception 'Selecciona un cliente'; end if;
  if not exists(select 1 from public.profiles where id = p_customer_id and role <> 'admin' and is_active = true) then
    raise exception 'El cliente seleccionado no existe o está inactivo';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'La venta no tiene productos'; end if;

  select coalesce(nullif(trim(full_name),''), nullif(trim(p_customer_name),''), 'Cliente tienda'), phone
    into v_customer_name, v_customer_phone
  from public.profiles where id = p_customer_id;

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
    p_customer_id, v_customer_name, '00000000', coalesce(nullif(v_customer_phone,''), '-'), 'Venta presencial',
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
      (select id from public.product_variants where id::text = nullif(v_item->>'variant_id','') limit 1),
      nullif(v_item->>'variant_type',''), nullif(v_item->>'variant_value','')
    );
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.register_manual_sale(uuid,text,text,text,jsonb) to authenticated;
