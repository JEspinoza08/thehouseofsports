-- ATENCION: revierte el esquema y elimina las asociaciones de colores.
-- Ejecutar solo si se decide revertir la funcionalidad.
ALTER TABLE public.product_images DROP COLUMN IF EXISTS color_name;
