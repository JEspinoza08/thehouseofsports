# THS - Corrección de stock y modales de combos

## Stock único entre compra normal y combos
- El carrito ahora contabiliza el stock real por producto/variante sin importar si la unidad viene de una compra normal o de un combo.
- Si una talla tiene stock 1 y ya está reservada en el carrito, no puede volver a seleccionarse dentro de un combo ni como producto suelto.
- Los combos se agregan de forma atómica: si una de sus piezas no tiene stock, no se agrega ninguna pieza del combo.
- Al cargar carritos guardados por la versión anterior se sanea cualquier sobreventa existente; un combo incompleto se descarta completo.
- Los botones + del carrito y checkout respetan el stock total reservado por otras líneas del mismo producto/variante.

## Modal de producto dentro de combos
- Se fuerza fondo blanco + tipografía oscura en todo el contenido del modal para evitar textos blancos invisibles heredados de la sección oscura de Combos THS.
- Se corrigieron títulos de características, color, talla/número, precio, descripción y controles.
- Las variantes muestran disponibilidad restante (descontando lo que ya está en el carrito).

## Personalización
- El panel de personalización fuerza texto oscuro, inputs blancos, placeholders visibles y opciones legibles.
- Se mantiene el flujo para guardar personalización dentro del producto del combo sin salir de la selección.
