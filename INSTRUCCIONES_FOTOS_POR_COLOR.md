# Fotos por color en THS

1. Ejecutar `sql/20261008_product_image_colors.sql` en Supabase SQL Editor.
2. En Administrador > Productos > Editar, verificar que existan variantes con los nombres de color (p. ej. Amarillo y Negro).
3. En **Galería de imágenes**, asignar a cada foto el color correspondiente en el selector **Color de esta foto**. Las fotos sin color asignado son generales y siguen disponibles para todos.
4. Guardar el producto. En la tienda, al seleccionar un color, la imagen principal cambia a la primera foto asociada y las miniaturas muestran las fotos del color elegido más las generales. La selección de talla y stock no se modifica.
5. Si se revierte el frontend, ejecutar el rollback SQL únicamente cuando ya no se necesiten las asociaciones de colores.

Nota: las imágenes ya subidas no pueden asociarse con certeza a un color solo por su contenido; hay que asignarlas una vez desde el panel de administración.
