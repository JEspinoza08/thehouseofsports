# THS · Categorías dinámicas + retiro en tienda

## 1. Categorías del footer

El footer ya no usa una lista fija. Ahora comparte la misma fuente de categorías activas y ordenadas que el menú principal (`categories`, `is_active = true`, `sort_order`) mediante `src/services/categoryNavigation.ts`.

Al crear, activar, desactivar o reordenar una categoría desde Admin > Categorías, el menú principal y el footer quedan sincronizados. Se muestran hasta 6 categorías, igual que el menú principal.

## 2. Retiro en tienda

En Checkout ahora se puede elegir:

- Envío a domicilio: usa la tarifa configurada y mantiene envío gratis desde S/ 400.
- Retiro en tienda: costo S/ 0.00, no solicita dirección y el total de Culqi no incluye envío.

Los pedidos con retiro en tienda quedan guardados con `delivery_method = pickup` y pasan inicialmente a `preparando`. Su flujo es:

`preparando -> listo_para_recoger -> entregado`

Los pedidos con envío mantienen:

`pendiente -> preparando -> enviado -> entregado`

El panel Admin limita las opciones de estado según el tipo de entrega y Mi Cuenta muestra una línea de tiempo distinta para retiro.

## 3. Supabase requerido

Antes de probar esta versión:

1. Ejecutar `supabase/THS_RETIRO_TIENDA_27082026.sql` en Supabase > SQL Editor.
2. Desplegar `create-payment` actualizado.
3. Desplegar `update-order-status` actualizado.
4. Desplegar la nueva función `set-order-delivery-method`.
5. Desplegar `send-order-email` actualizado.

Ejemplo con Supabase CLI:

```bash
supabase functions deploy create-payment
supabase functions deploy update-order-status
supabase functions deploy set-order-delivery-method
supabase functions deploy send-order-email
```

No es necesario modificar `emit-nubefact`: para retiro en tienda `shipping_cost` llega en 0 y el comprobante se calcula correctamente con el subtotal de productos.
