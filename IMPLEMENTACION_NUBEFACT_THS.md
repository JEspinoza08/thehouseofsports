# THS · Integración NubeFact DEMO → Producción

## 1. Ejecutar SQL

En Supabase SQL Editor ejecuta:

`supabase/THS_NUBEFACT_DEMO.sql`

Esto crea `electronic_documents`, la numeración por serie y las políticas RLS.

## 2. Crear credenciales DEMO en NubeFact

Desde la cuenta NubeFact de THS obtén la **RUTA** y el **TOKEN** de pruebas/integración JSON.

No pongas el token en `.env` de Vite ni en GitHub.

## 3. Secrets de Supabase

Configura en Supabase Edge Functions:

```text
NUBEFACT_MODE=demo
NUBEFACT_DEMO_URL=RUTA_DEMO_DE_NUBEFACT
NUBEFACT_DEMO_TOKEN=TOKEN_DEMO_DE_NUBEFACT
NUBEFACT_BOLETA_SERIE=BBB1
NUBEFACT_FACTURA_SERIE=FFF1
```

`BBB1` y `FFF1` son solo valores iniciales para DEMO. Usa las series que NubeFact muestre/habilite en la cuenta.

Para producción, más adelante:

```text
NUBEFACT_MODE=production
NUBEFACT_PROD_URL=RUTA_PRODUCTIVA
NUBEFACT_PROD_TOKEN=TOKEN_PRODUCTIVO
NUBEFACT_BOLETA_SERIE=SERIE_PRODUCTIVA_BOLETA
NUBEFACT_FACTURA_SERIE=SERIE_PRODUCTIVA_FACTURA
```

## 4. Desplegar la Edge Function

```bash
supabase functions deploy emit-nubefact
```

Si trabajas con el CLI enlazado al proyecto:

```bash
supabase link --project-ref TU_PROJECT_REF
supabase functions deploy emit-nubefact
```

## 5. Flujo implementado

1. Cliente completa entrega y elige **Boleta** o **Factura**.
2. Culqi cobra con el flujo actual.
3. Si el pago es aprobado, THS crea la orden y descuenta stock.
4. THS invoca `emit-nubefact`.
5. La función recalcula IGV (precios con IGV incluido), agrega el delivery como ítem y envía el JSON a NubeFact.
6. Se guarda el resultado en `electronic_documents`.
7. Si NubeFact falla, **el pedido sigue pagado** y el comprobante queda en `error/rejected` para reintento.
8. Un reintento conserva la misma serie y correlativo para evitar duplicados.

## 6. Casos de prueba mínimos

- Boleta + DNI válido.
- Factura + RUC de 11 dígitos.
- Pedido con varios productos.
- Pedido con variantes.
- Pedido con personalización incluida en el precio del ítem.
- Pedido con delivery.
- Error intencional de TOKEN/RUTA.
- Reintento de un comprobante fallido.
- Intento de reemitir uno ya emitido: debe devolver el existente y no duplicarlo.

## Nota de producción

Para producción es recomendable usar una serie dedicada a las ventas web de THS y confirmar con NubeFact el correlativo inicial. Si THS emite por otros sistemas/canales con la misma serie, no compartas esa serie sin coordinar la numeración.
