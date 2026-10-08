-- THS · Retiro en tienda + estado listo para recoger
-- Ejecutar una sola vez en Supabase > SQL Editor antes de desplegar el frontend/functions de esta versión.

begin;

alter table public.orders
  add column if not exists delivery_method text not null default 'delivery';

-- Normaliza cualquier valor previo por seguridad.
update public.orders
set delivery_method = 'delivery'
where delivery_method is null or delivery_method not in ('delivery', 'pickup');

alter table public.orders
  drop constraint if exists orders_delivery_method_check;

alter table public.orders
  add constraint orders_delivery_method_check
  check (delivery_method in ('delivery', 'pickup'));

-- La instalación histórica usa normalmente orders_status_check.
-- Se recrea para permitir el nuevo estado de retiro en tienda.
alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pendiente', 'preparando', 'listo_para_recoger', 'enviado', 'entregado', 'cancelado'));

create index if not exists orders_delivery_method_idx
  on public.orders(delivery_method, created_at desc);

commit;
