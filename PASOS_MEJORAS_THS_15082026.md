# THS - mejoras solicitadas (15/08/2026)

## Qué quedó implementado

1. Personalización de guantes como adicional:
   - activación por producto desde Admin > Productos;
   - opciones configurables con precio adicional;
   - nombre/texto, número y bandera/emoji;
   - cálculo del adicional en el carrito y checkout;
   - validación del adicional dentro de `create-payment` para que el precio no dependa del navegador;
   - detalle visible en pedidos del admin y en Mi cuenta.

2. Banners administrables:
   - nueva ruta `/admin/banners`;
   - carga independiente de imagen desktop y mobile;
   - orden, estado activo, filtro por marca y URL opcional;
   - el Hero usa los banners de Supabase; si aún no hay ninguno, mantiene los banners locales actuales.

3. Variantes por color + talla/número + stock:
   - cada combinación color/talla tiene su propio stock;
   - selector de color y luego talla/número en el producto;
   - se mantiene compatibilidad con productos sin color.

4. Más de una imagen por producto:
   - galería administrable;
   - imagen principal seleccionable;
   - miniaturas en el modal del producto.

5. Categorías administrables:
   - nueva ruta `/admin/categories`;
   - nombre, slug, imagen, orden, activo y mostrar en Home;
   - Productos toma las categorías desde Supabase;
   - nuevas categorías pueden mostrarse en Home y Navbar y tienen ruta `/categoria/:slug`.

## Paso 1 - Ejecutar SQL

En Supabase > SQL Editor ejecuta completo:

`THS_MEJORAS_15082026.sql`

Este script es aditivo y no borra productos, pedidos ni usuarios existentes.

## Paso 2 - Desplegar nuevamente create-payment

Se modificó:

`supabase/functions/create-payment/index.ts`

Debes volver a desplegar esa Edge Function para que Culqi valide y cobre los adicionales de personalización en backend.

Con Supabase CLI, desde la raíz del proyecto:

```bash
supabase functions deploy create-payment
```

No necesitas cambiar las variables/secretos Culqi actuales.

## Paso 3 - Primer uso de banners

Entra a `/admin/banners` y registra los banners que quieras administrar desde Supabase. Cada banner requiere una imagen web y otra mobile.

Mientras la tabla esté vacía, el Home seguirá mostrando los banners locales actuales, por lo que no se rompe el Hero.

## Paso 4 - Personalización de guantes

En `/admin/products`, edita un guante y activa “Permitir personalización”. Al activarlo por primera vez se crean como base las tres opciones de referencia:

- Nombre y/o número.
- Nombre, número y bandera o emoji.
- Bandera o emoji.

Los precios quedan editables en soles desde el mismo formulario.

## Paso 5 - Colores y tallas

Activa “Tiene variantes”. Registra una fila por combinación, por ejemplo:

- Negro / Talla 8 / stock 3
- Negro / Talla 9 / stock 5
- Blanco / Talla 8 / stock 2
- Blanco / Talla 9 / stock 4

De esta manera cada color+talla conserva stock independiente.
