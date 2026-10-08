-- Ejecutar en Supabase SQL Editor ANTES de desplegar el frontend.
ALTER TABLE public.product_images ADD COLUMN IF NOT EXISTS color_name text;
COMMENT ON COLUMN public.product_images.color_name IS 'Color asociado a la foto; NULL significa imagen general.';
