-- THS - Venta presencial mejorada
-- Ejecutar una sola vez en Supabase > SQL Editor.

drop function if exists public.register_manual_sale(uuid,text,text,text,jsonb);
drop function if exists public.register_manual_sale(uuid,text,text,text,text,jsonb);

create or replace function public.register_manual_sale(
  p_customer_id uuid,
  p_customer_name text,
  p_customer_dni text,
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
  v_order_item_id text;
  v_item jsonb;
  v_custom jsonb;
  v_total numeric := 0;
  v_product_id bigint;
  v_qty integer;
  v_price numeric;
  v_stock integer;
  v_customer_name text;
  v_customer_phone text;
begin
  if auth.uid() is null then raise exception 'No autenticado'; end if;
  if not exists(select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active = true) then raise exception 'No tienes permisos de administrador'; end if;
  if p_customer_id is null then raise exception 'Selecciona un cliente'; end if;
  if not exists(select 1 from public.profiles where id = p_customer_id and role <> 'admin' and is_active = true) then raise exception 'El cliente seleccionado no existe o está inactivo'; end if;
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
    p_customer_id, v_customer_name, coalesce(nullif(regexp_replace(p_customer_dni,'\D','','g'),''),'00000000'), coalesce(nullif(v_customer_phone,''), '-'), 'Venta presencial',
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
    ) returning id::text into v_order_item_id;

    v_custom := v_item->'customization';
    if v_custom is not null and jsonb_typeof(v_custom) = 'object' and nullif(v_custom->>'option_id','') is not null then
      insert into public.order_item_customizations(
        order_item_id, order_id, product_id, option_id, option_label, surcharge,
        custom_text, custom_number, flag_type, flag_value, summary
      ) values (
        v_order_item_id, v_order_id, v_product_id,
        (select id from public.product_customization_options where id::text = v_custom->>'option_id' limit 1),
        coalesce(nullif(v_custom->>'option_label',''),'Personalización'),
        coalesce((v_custom->>'surcharge')::numeric,0),
        nullif(v_custom->>'text',''), nullif(v_custom->>'number',''),
        nullif(v_custom->>'flag_type',''), nullif(v_custom->>'flag_value',''),
        nullif(v_custom->>'summary','')
      ) on conflict (order_item_id) do update set
        option_id = excluded.option_id, option_label = excluded.option_label, surcharge = excluded.surcharge,
        custom_text = excluded.custom_text, custom_number = excluded.custom_number,
        flag_type = excluded.flag_type, flag_value = excluded.flag_value, summary = excluded.summary;
    end if;
  end loop;
  return v_order_id;
end;
$$;

grant execute on function public.register_manual_sale(uuid,text,text,text,text,jsonb) to authenticated;
