# Culqi en THS — solo tarjetas

La integración quedó preparada con **Culqi Custom Checkout**, porque Culqi indica que Checkout v4 dejará de estar disponible. El frontend solo habilita `tarjeta`; Yape, PagoEfectivo, billeteras, agentes y Cuotéalo quedan desactivados. También se deshabilitaron cuotas para que el flujo sea únicamente pago directo con tarjeta débito/crédito.

## 1. Frontend / Vercel

Agrega la llave pública de Culqi:

```env
VITE_CULQI_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxx
```

Para producción cambia a tu `pk_live_...`.

> La llave pública sí puede estar en el frontend. Nunca coloques `CULQI_PRIVATE_KEY` en Vite/Vercel como variable `VITE_*`.

## 2. Supabase Edge Function

En Supabase > Edge Functions > Secrets agrega:

```text
CULQI_PRIVATE_KEY=sk_test_xxxxxxxxxxxxxxxxx
```

En producción usa `sk_live_...`.

Los secretos estándar `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` son usados por la función para autenticar al cliente y recalcular precios/envío del lado servidor.

## 3. Desplegar la función

La función actualizada está en:

```text
supabase/functions/create-payment/index.ts
```

Con CLI:

```bash
supabase functions deploy create-payment
```

El proyecto ya tiene `verify_jwt = true` para esta función en `supabase/config.toml`.

## 4. Flujo implementado

1. Cliente inicia sesión y completa entrega.
2. Pulsa **Pagar con tarjeta**.
3. Se abre Culqi Custom Checkout mostrando solo tarjeta.
4. Culqi tokeniza la tarjeta en el navegador.
5. Se manda únicamente el token + IDs/cantidades del carrito a `create-payment`.
6. La Edge Function vuelve a consultar productos, precios, stock y tarifa de envío en Supabase. No confía en el monto enviado por el navegador.
7. La Edge Function crea el cargo en Culqi con la llave privada.
8. Solo si Culqi responde exitosamente se registra la orden como `paid` y se descuenta stock mediante el flujo existente `create_complete_order`.

## 5. Pruebas

Usa primero llaves `pk_test_` + `sk_test_` y tarjetas de prueba indicadas por Culqi. No mezcles llave pública de prueba con llave privada live, ni al revés.

## Importante

El Checkout v4 anterior (`https://checkout.culqi.com/js/v4`) fue reemplazado en `CheckoutPage.tsx` por Custom Checkout (`https://js.culqi.com/checkout-js`).
