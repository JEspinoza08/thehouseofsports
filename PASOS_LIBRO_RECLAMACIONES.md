# Activación del Libro de Reclamaciones

1. Entra a Supabase > SQL Editor.
2. Abre el archivo `SUPABASE_LIBRO_RECLAMACIONES.sql`, copia todo y ejecútalo.
3. Vuelve a desplegar el proyecto en Vercel.
4. Abre `/libro-de-reclamaciones` y realiza un registro de prueba.
5. Confirma en Supabase > Table Editor > `claims_book` que apareció el registro.
6. Reemplaza “Lima, Perú” por el domicilio fiscal/comercial exacto del proveedor en:
   - `src/pages/ClaimsBook.tsx`
   - `src/pages/Terms.tsx`
   - `src/pages/Privacy.tsx`
7. Conserva y responde cada reclamo o queja dentro de 15 días hábiles.

La web genera una constancia imprimible y un código único. La política RLS permite crear registros, pero no permite que visitantes lean los reclamos de otras personas.
