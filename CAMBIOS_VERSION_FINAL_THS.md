# Cambios versión final THS

Esta versión incorpora el primer bloque completo de requerimientos enviados por THS.

## Implementado

- Paleta principal ajustada de naranja a rojo THS.
- Beneficios actualizados: envío gratis desde S/400, productos originales, personalización y pagos seguros.
- Sección de productos renombrada a **EQUÍPATE CON THS** con el texto solicitado.
- Categoría **Ofertas** visible dentro de los filtros del catálogo.
- Filtros especiales administrables por producto:
  - Guantes: tipo de látex.
  - Zapatillas/calzado: tipo de suela.
  - Accesorios/protecciones: tipo de modelo.
- Etiquetas de producto mejoradas: etiqueta configurada, ahorro porcentual y aviso **Acaba pronto** por bajo stock.
- Guía de tallas por producto con imagen administrable desde el panel.
- Nueva sección **COMBOS THS**.
- Nueva sección **¿NO SABES QUÉ ELEGIR?** para POKER, TLSS y 181 KEEPERS.
- Sección institucional reemplazada por **NUESTROS ATLETAS** / referentes.
- Beneficios inferiores ajustados a ESPECIALISTAS, CALIDAD y COMPROMISO con lenguaje más general.
- Textos de páginas de categoría ajustados al enfoque solicitado.
- Navegación superior actualizada con nombres más comerciales.

## Paso obligatorio en Supabase

Ejecutar una sola vez el archivo:

`THS_REQUERIMIENTOS_FINAL_20082026.sql`

Este agrega en `products`:

- `size_guide_url`: imagen de guía de tallas por producto.
- `filter_attributes`: atributos JSON para filtros específicos por categoría.

No elimina ni modifica datos existentes.

## Panel administrador

Al editar/crear un producto ahora encontrarás:

- Campo de filtro específico según categoría.
- Sección para subir la imagen de guía de tallas.
- Las etiquetas existentes siguen configurándose desde el campo **Etiqueta**.

