-- THS · Modo mantenimiento administrable desde /admin/settings
-- Ejecutar una sola vez en Supabase > SQL Editor.

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  maintenance_enabled boolean not null default false,
  maintenance_title text not null default 'Estamos preparando algo mejor',
  maintenance_message text not null default 'Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (
  id,
  maintenance_enabled,
  maintenance_title,
  maintenance_message
)
values (
  1,
  false,
  'Estamos preparando algo mejor',
  'Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.'
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

-- La web pública necesita leer este único ajuste para saber si debe bloquearse.
drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

-- Solo administradores activos pueden modificar el modo mantenimiento.
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
      and coalesce(pr.is_active, true) = true
  )
)
with check (
  exists (
    select 1
    from public.profiles pr
    where pr.id = auth.uid()
      and pr.role = 'admin'
      and coalesce(pr.is_active, true) = true
  )
);
