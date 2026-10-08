# Implementación THS: blog, dashboard y ventas presenciales

## Paso obligatorio en Supabase
Ejecuta en SQL Editor el archivo:

`supabase/THS_ADMIN_BLOG_VENTAS.sql`

Ese script crea:
- tabla `blog_posts` + políticas RLS;
- bucket público `blog-images` para portadas;
- columnas `sales_channel` e `internal_notes` en `orders`;
- función `register_manual_sale(...)` para registrar ventas presenciales y descontar stock de forma atómica.

## Nuevas rutas públicas
- `/blog`
- `/blog/:slug`

El home también muestra los 3 últimos artículos publicados.

## Nuevas rutas admin
- `/admin`: dashboard integral
- `/admin/products`: productos y stock
- `/admin/orders`: pedidos
- `/admin/manual-sales`: ventas presenciales
- `/admin/blog`: creación/edición/publicación del blog

## Ventas presenciales
Las ventas registradas desde `/admin/manual-sales` quedan:
- `payment_status = paid`
- `status = entregado`
- `sales_channel = store`
- envío = S/ 0

El RPC bloquea y valida stock antes de descontarlo. Si una línea no tiene stock suficiente, la transacción falla completa.

## Dashboard
El resumen considera como ingreso las órdenes con `payment_status = paid` y que no estén canceladas. Se desglosa por:
- Lima / provincias
- online / tienda física
- caja acumulada
- ingresos del mes / hoy
- stock total / stock bajo

## Datos legales
Se reemplazaron menciones de PadelShop por The House of Sports Perú. No se inventó información fiscal no proporcionada: RUC y dirección fiscal quedan señalados como "por completar" para que se sustituyan con los datos legales reales antes de producción.
