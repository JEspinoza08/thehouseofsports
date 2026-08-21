-- ============================================================
-- THS · NubeFact (DEMO/Producción)
-- Ejecutar una sola vez en Supabase SQL Editor.
-- Crea almacenamiento de comprobantes, numeración por serie y RLS.
-- ============================================================

create table if not exists public.electronic_documents (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (document_type in ('boleta','factura')),
  document_type_code integer not null check (document_type_code in (1,2)),
  series text not null,
  number integer not null check (number > 0),
  customer_document_type integer not null,
  customer_document_number text not null,
  customer_name text not null,
  customer_address text,
  customer_email text,
  currency text not null default 'PEN',
  taxable_amount numeric(12,2) not null default 0,
  igv numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','issued','rejected','error')),
  nubefact_mode text not null default 'demo' check (nubefact_mode in ('demo','production')),
  nubefact_link text,
  nubefact_pdf_url text,
  nubefact_xml_url text,
  nubefact_cdr_url text,
  accepted_by_sunat boolean,
  sunat_responsecode text,
  sunat_description text,
  error_message text,
  request_payload jsonb,
  response_payload jsonb,
  issued_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type, series, number)
);

create index if not exists electronic_documents_user_idx
  on public.electronic_documents(user_id, created_at desc);
create index if not exists electronic_documents_status_idx
  on public.electronic_documents(status, created_at desc);

create table if not exists public.electronic_document_sequences (
  document_type text not null check (document_type in ('boleta','factura')),
  series text not null,
  next_number integer not null default 1 check (next_number > 0),
  updated_at timestamptz not null default now(),
  primary key (document_type, series)
);

-- Reserva atómica de correlativo. La Edge Function usa service_role.
create or replace function public.reserve_electronic_document_number(
  p_document_type text,
  p_series text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_number integer;
begin
  if p_document_type not in ('boleta','factura') then
    raise exception 'Tipo de comprobante inválido';
  end if;

  if p_series is null or length(trim(p_series)) <> 4 then
    raise exception 'La serie debe tener exactamente 4 caracteres';
  end if;

  insert into public.electronic_document_sequences(document_type, series, next_number)
  values (p_document_type, upper(trim(p_series)), 2)
  on conflict (document_type, series)
  do update set
    next_number = public.electronic_document_sequences.next_number + 1,
    updated_at = now()
  returning next_number - 1 into v_number;

  return v_number;
end;
$$;

revoke all on function public.reserve_electronic_document_number(text,text) from public;
grant execute on function public.reserve_electronic_document_number(text,text) to service_role;

alter table public.electronic_documents enable row level security;
alter table public.electronic_document_sequences enable row level security;

-- Cliente: solo ve comprobantes de sus propias órdenes.
drop policy if exists "Users read own electronic documents" on public.electronic_documents;
create policy "Users read own electronic documents"
on public.electronic_documents for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and coalesce(p.is_active, true) = true
  )
);

-- No se habilita INSERT/UPDATE directo desde el navegador.
-- Toda emisión/reintento se realiza con la Edge Function emit-nubefact.
