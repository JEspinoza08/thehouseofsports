# THS · Correos de pedidos con Supabase Edge Functions + Resend

El frontend ya invoca estas dos funciones:

- `send-order-email` después de registrar una compra online.
- `update-order-status` desde `AdminOrders.tsx` al cambiar pendiente/preparando/enviado/entregado/cancelado.

Por eso no fue necesario cambiar esos TSX.

## Secretos requeridos

En Supabase > Edge Functions > Secrets configura:

```text
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=The House of Sports <pedidos@thehouseofsports.pe>
RESEND_REPLY_TO=admi.ths.pe@gmail.com
```

`RESEND_REPLY_TO` es opcional. `RESEND_FROM_EMAIL` debe usar un dominio verificado en Resend para enviar a clientes reales.

Los secretos `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son usados por las funciones. Supabase normalmente expone los secretos de proyecto a las Edge Functions.

## Crear / desplegar con CLI

Desde la raíz del proyecto:

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase functions deploy send-order-email
npx supabase functions deploy update-order-status
```

Si todavía no cargaste los secretos por Dashboard:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
npx supabase secrets set 'RESEND_FROM_EMAIL=The House of Sports <pedidos@thehouseofsports.pe>'
npx supabase secrets set RESEND_REPLY_TO=admi.ths.pe@gmail.com
```

## Si prefieres Dashboard

Crea una función llamada exactamente `send-order-email` y pega el contenido de:

`supabase/functions/send-order-email/index.ts`

Luego crea `update-order-status` y pega:

`supabase/functions/update-order-status/index.ts`

## Pruebas

1. Compra con una cuenta cliente y confirma que `CheckoutPage.tsx` ya no muestra error de CORS/401 para `send-order-email`.
2. Revisa Logs de `send-order-email` y el panel de Resend.
3. En `/admin`, cambia el pedido de `pendiente` a `preparando`.
4. Debe actualizarse la orden y llegar un correo al cliente.
5. Repite con `enviado`, `entregado` o `cancelado`.
6. Si seleccionas el mismo estado dos veces, la función no envía correo duplicado.

## Importante

La función `update-order-status` valida que quien la invoque tenga `profiles.role = 'admin'` e `is_active = true`. La actualización de estado se realiza con Service Role solo después de validar al administrador.

`send-order-email` solo permite enviar la confirmación al dueño de la orden o a un administrador.
