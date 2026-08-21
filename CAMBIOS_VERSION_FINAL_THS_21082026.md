# THS – Ajustes finales 21/08/2026

## 1. Combos THS administrables
- Se eliminó la lógica de combos fijos quemados en código.
- Nueva tabla `product_combos`.
- Nueva vista `/admin/combos`.
- El administrador puede crear, editar, ocultar y eliminar combos.
- Cada combo permite seleccionar 2 o más productos reales del catálogo, portada, descripción, etiqueta, precio opcional y orden.
- El Home carga automáticamente todos los combos activos.

## 2. Guía de marcas rediseñada
- Se rehízo `¿NO SABES QUÉ ELEGIR?` con fondo visual y 3 piezas gráficas para POKER, TLSS y 181 KEEPERS.
- Se incorporaron assets generados específicamente para esta versión dentro de `src/assets`.
- Mantiene rojo THS como acento y una composición más deportiva/premium.

## 3. Blog de atletas independiente
- Nueva tabla `athletes`.
- Nueva administración `/admin/athletes`.
- Nueva vista cliente `/atletas`.
- Nueva vista detalle `/atletas/:slug`, inspirada en una ficha editorial de atleta/producto.
- Permite foto principal, foto secundaria/producto, marca, rol, resumen, historia completa, destacado y estado borrador/publicado.
- El CTA `CONOCE A LOS REFERENTES` ahora dirige al blog de atletas, no al THS Journal.
- El carrusel de `Nuestros atletas` usa automáticamente las fotos de atletas publicados; si todavía no hay registros conserva las imágenes actuales como fallback.

## 4. Categorías según indicación del dueño
- `Bolsos y Mochilas` fue reemplazado por `Rodilleras`.
- Se actualizó el filtro de productos, menú, fallback de categorías y migración de datos.
- La vista de Rodilleras se presenta comercialmente como `Protecciones` y usa el texto de 181 KEEPERS solicitado.
- Se mantuvieron separados Ropa y Accesorios.
- Ofertas ahora incluye el texto de últimas unidades/oportunidades por tiempo limitado.
- THS Journal usa el texto `Noticias, lanzamientos, tecnología, reseñas...`.

## Base de datos
Ejecutar una sola vez en Supabase SQL Editor:
`THS_REQUERIMIENTOS_FINAL_21082026.sql`

Este script crea las tablas nuevas, RLS de administración y migra la categoría Bolsos/Mochilas a Rodilleras.
