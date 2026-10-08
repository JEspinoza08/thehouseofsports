# THS · Clientes, empleados y ventas presenciales asociadas

## 1. Ejecuta el SQL
En Supabase > SQL Editor ejecuta:

`supabase/THS_CLIENTES_EMPLEADOS.sql`

Este script:
- agrega/normaliza los datos de `profiles` (`email`, `phone`, `role`, `is_active`),
- permite diferenciar clientes y empleados admin,
- reemplaza `register_manual_sale` para que la orden presencial pertenezca al cliente elegido,
- mantiene el descuento atómico de stock.

## 2. Despliega la Edge Function
Despliega:

`supabase/functions/admin-users`

Ejemplo con CLI:

```bash
supabase functions deploy admin-users
```

La función usa automáticamente los secretos estándar del proyecto:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en Vite ni en el navegador.

## 3. Nueva vista admin
Ruta:

`/admin/users`

Permite:
- crear clientes,
- crear empleados con rol admin,
- buscar usuarios,
- dar de baja (bloquea login),
- reactivar usuarios.

## 4. Venta presencial
`/admin/manual-sales` ahora obliga a seleccionar un cliente activo.

Si no existe:
1. pulsa **Nuevo**,
2. ingresa nombre, correo y teléfono,
3. el sistema crea la cuenta,
4. la contraseña inicial se genera usando el correo sin `@`.

Ejemplo:
- correo: `cliente@gmail.com`
- contraseña inicial: `clientegmail.com`

La venta se guarda con `orders.user_id = cliente.id`, `sales_channel = 'store'`, `payment_status = 'paid'` y `status = 'entregado'`. Por eso luego el cliente verá esa compra en **Mi cuenta**, junto a las compras hechas por web.

> Recomendación de seguridad: la contraseña basada en el correo es predecible. Para producción conviene pedir al cliente que la cambie después del primer ingreso o migrar luego a un flujo de “crear contraseña” por correo.
