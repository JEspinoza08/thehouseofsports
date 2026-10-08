-- Ejecutar UNA sola vez en Supabase > SQL Editor.
-- Requerimientos finales THS: guía de tallas por producto + atributos dinámicos de filtro.

alter table public.products
  add column if not exists size_guide_url text;

alter table public.products
  add column if not exists filter_attributes jsonb not null default '{}'::jsonb;

comment on column public.products.size_guide_url is
  'URL pública de la imagen de guía de tallas específica del producto.';

comment on column public.products.filter_attributes is
  'Atributos adicionales para filtros del catálogo. Ej: latex_type, sole_type, protection_model.';

-- Ejemplos opcionales:
-- update public.products set filter_attributes = jsonb_build_object('latex_type','Contact Latex') where id = 1;
-- update public.products set filter_attributes = jsonb_build_object('sole_type','TF') where id = 2;
-- update public.products set filter_attributes = jsonb_build_object('protection_model','Rodillera') where id = 3;
