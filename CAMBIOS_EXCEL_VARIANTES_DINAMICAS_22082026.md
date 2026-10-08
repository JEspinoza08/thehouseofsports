# THS - Excel de productos con variantes agrupadas

Se actualizó la exportación de productos para reflejar la misma jerarquía visual del panel admin.

## Comportamiento
- Cada producto se exporta como una fila principal.
- Si el producto tiene variantes, estas se exportan debajo como filas de detalle.
- Las filas de variantes quedan contraídas por defecto.
- Excel muestra los controles de esquema `+ / -` a la izquierda para expandir y contraer las variantes.
- La fila principal conserva SKU, nombre, marca, categoría, stock total, precio y estado.
- Cada variante muestra valor de variante, color, stock individual, precio y estado.
- Los productos sin variantes se muestran como una sola fila.
- La exportación de pedidos/ventas mantiene su funcionamiento actual.

## Archivos modificados
- `src/lib/exportExcel.ts`
- `src/pages/admin/AdminDashboard.tsx`
