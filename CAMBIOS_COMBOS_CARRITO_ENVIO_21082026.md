# THS - Combos, carrito y envío gratis (21/08/2026)

## Cambios aplicados

- Los productos de un combo ya no redirigen a sus páginas de categoría.
- Al hacer clic en cada producto dentro del combo se abre el mismo modal completo de producto.
- En ese modal se puede elegir color, talla/número, guía de tallas y personalización.
- La selección queda guardada mientras se configura el resto del combo.
- El combo solo se puede agregar cuando todos sus productos han sido configurados.
- Si el combo tiene `combo_price`, el descuento se distribuye proporcionalmente entre sus productos.
- Las personalizaciones se suman sobre el precio del combo sin ser descontadas.
- Si el producto se compra fuera de un combo conserva su precio normal.
- Los productos de un combo quedan agrupados en carrito; eliminar una línea del combo elimina el combo completo para evitar pedidos incompletos.
- El carrito se persiste en `localStorage`, por lo que navegar o recargar la página ya no borra productos seleccionados.
- Envío gratis automático para subtotal desde S/ 400, tanto en frontend como en la Edge Function de Culqi.
- Política de envíos actualizada con el beneficio de envío gratis desde S/ 400 a todo el Perú.
- Niveles de producto en admin actualizados a: Entrenamiento, Pre profesional y Profesional.

## IMPORTANTE - Supabase

No hace falta ejecutar un SQL nuevo para estos cambios.

Sí debes volver a desplegar la Edge Function `create-payment`, porque ahora valida combos en servidor, aplica el precio real del combo y aplica envío gratis desde S/ 400.

Ejemplo con Supabase CLI:

```bash
supabase functions deploy create-payment
```

La función conserva la validación segura de precios desde Supabase: el frontend no decide el monto que finalmente se cobra.
