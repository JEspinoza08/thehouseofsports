# THS - SKU + exportación Excel + mejora Brand Finder

## 1. Brand Finder / Marcas
- Se hizo más visible la foto de los jugadores de fútbol.
- Se ajustó el degradado para conservar legibilidad del texto a la izquierda.
- Se reforzó el contraste, borde y sombra de las 3 tarjetas para que sigan destacando sobre el fondo.

## 2. Gestión de productos
- Nuevo campo obligatorio `Código SKU` en el formulario.
- Búsqueda por Código SKU, nombre, marca o categoría.
- La tabla ahora se presenta a nivel de producto/variante y muestra:
  - Código SKU
  - Variante
  - Nombre
  - Stock
  - Precio
  - Activo
  - Acciones
- Los productos con variantes generan una fila por variante para poder revisar stock de manera directa.

## 3. Excel
- Botón `Exportar Excel` en Gestión de productos.
- Botón `Exportar Excel` en Gestión de pedidos/ventas.
- Se genera un archivo `.xls` compatible con Microsoft Excel sin agregar dependencias externas.
- Productos exporta una fila por variante.
- Ventas exporta una fila por ítem de pedido e incluye datos principales del pedido, cliente, pago, producto, variante, cantidades y totales.

## 4. Supabase
Ejecutar primero `THS_SKU_EXPORT_EXCEL_22082026.sql` para crear `products.sku_code` y su índice único.
