# THS - Requerimientos 5 (21/08/2026)

## Home / categorías
- En desktop las categorías ya no saltan a una segunda fila.
- Se muestran en un carrusel horizontal de una sola fila con flechas izquierda/derecha.
- Mobile conserva su carrusel independiente.

## Mi Cuenta mobile
- Cabecera y espaciados más compactos.
- KPIs Pedidos / En proceso / Entregados en una sola fila de tres columnas en móvil.
- Tarjetas y listado de pedidos reducidos para aprovechar mejor 375px de ancho.

## Admin / Venta presencial
- Solo lista productos con stock disponible real.
- Cada producto abre el mismo configurador visual de producto para elegir talla/número, color y personalización.
- Se muestran los Combos THS activos.
- Cada combo exige configurar todos sus productos y respeta el precio especial del combo + personalizaciones.
- Se añadió selección Boleta / Factura.
- Boleta solicita DNI; Factura solicita RUC, razón social y dirección fiscal.
- Después de registrar la venta se invoca NubeFact, se envía el comprobante electrónico y también la confirmación del pedido al correo del cliente seleccionado.
- La venta continúa quedando pagada, entregada, asociada al cliente y descontando stock.

## Admin / Pedidos
- Nuevo bloque de indicadores: total, por preparar, en camino, entregados y ventas cobradas.
- Filtros rápidos por estado.
- Mejor jerarquía visual en las tarjetas de pedidos.

## SQL obligatorio
Ejecutar una sola vez en Supabase > SQL Editor:

`THS_REQUERIMIENTOS_FINAL_21082026_VENTA_PRESENCIAL.sql`

Este reemplaza `register_manual_sale` para recibir DNI y guardar personalizaciones de ventas presenciales.
