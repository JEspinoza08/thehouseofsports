# THS – Requerimientos 6 (21/08/2026)

## Banners con GIF
- Admin Banners acepta JPG, PNG, WEBP y GIF.
- Se valida que el banner desktop mida exactamente 1920×800 px.
- Se valida que el banner mobile mida exactamente 1080×1350 px.
- Los GIF se suben conservando `image/gif`, por lo que la animación no se convierte ni se pierde.
- La vista cliente usa `<img>` para desktop/mobile y reproduce el GIF de forma nativa dentro del hero.
- El panel muestra una etiqueta `GIF animado` al previsualizar uno.

## Navegación Admin estilo ERP
- En desktop (XL+) la navegación pasa a un sidebar lateral fijo.
- El sidebar no requiere scroll horizontal y tiene scroll vertical propio si la pantalla es baja.
- Las pantallas admin reservan espacio lateral para que el sidebar nunca tape el contenido.
- En tablet/mobile se usa un menú desplegable vertical compacto, también sin scroll horizontal.
- Se mantiene el estado activo en rojo THS y todos los accesos existentes.

No requiere SQL nuevo.
