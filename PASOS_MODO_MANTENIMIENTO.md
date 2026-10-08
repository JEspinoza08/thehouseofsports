# Modo mantenimiento · The House of Sports

## 1. Ejecutar SQL en Supabase

Abre **Supabase > SQL Editor** y ejecuta:

`supabase/THS_MODO_MANTENIMIENTO.sql`

Esto crea la tabla `site_settings`, inserta la configuración inicial y configura RLS para que:
- La web pública pueda consultar si el modo mantenimiento está activo.
- Solo un usuario `admin` activo pueda modificar la configuración.

## 2. Panel administrador

Luego del deploy ingresa a:

`/admin/settings`

También encontrarás la opción **Configuración** en el menú del panel.

Desde ahí puedes:
- Activar/desactivar **¿La web se encuentra en mantenimiento?**
- Editar el título mostrado al visitante.
- Editar el mensaje mostrado al visitante.
- Guardar los cambios.

## 3. Comportamiento

Cuando `maintenance_enabled = true`:
- Las rutas públicas (`/`, catálogo, checkout, cuenta, etc.) muestran la pantalla de mantenimiento.
- `/admin/login` y todas las rutas `/admin/*` siguen accesibles para que puedas desactivar el mantenimiento.
- La pantalla utiliza la identidad visual negro/naranja de THS y el logo actual.
- Incluye acceso al Instagram de THS.

Cuando `maintenance_enabled = false`, la tienda funciona normalmente.

## Nota de seguridad/continuidad

El frontend está configurado en modo **fail-open**: si la consulta de `site_settings` falla temporalmente, la tienda se mantiene visible en lugar de quedar bloqueada por error.
