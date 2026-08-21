import LegalPage, { LegalList, ProcessSteps } from "./LegalPage";

export default function Returns() {
  return (
    <LegalPage
      eyebrow="Cambios y devoluciones"
      title="Política de Cambios y Devoluciones"
      subtitle="Tienes 15 días calendario desde la recepción del producto para solicitar cambio o devolución si cumple las condiciones indicadas."
      updated="Enero 2026"
      icon="returns"
      sections={[
        { title: "¿Cuándo puedo solicitar un cambio o devolución?", content: <LegalList items={["El producto llegó defectuoso o dañado.", "El producto no corresponde a lo comprado: modelo, talla o color.", "El producto no coincide con la descripción publicada en la web.", "Cambio de talla en zapatillas y ropa, sujeto a stock.", "Arrepentimiento de compra dentro de los 7 días de recibido, siempre que el producto esté sin uso."]} /> },
        { title: "Condiciones del producto", content: <LegalList items={["Producto sin uso y en perfectas condiciones.", "Embalaje original intacto, incluyendo caja, bolsa y etiquetas.", "Boleta o factura de compra.", "No aplica a productos de uso personal que hayan sido abiertos o utilizados, ni a productos personalizados."]} /> },
        { title: "Proceso de devolución", content: <ProcessSteps steps={[{ title: "Solicita la devolución", description: "Envía un correo a admi.ths.pe@gmail.com con asunto DEVOLUCIÓN - [N° pedido], fotos del producto y descripción del motivo." }, { title: "Aprobación", description: "Nuestro equipo revisa la solicitud y confirma si aplica en un plazo aproximado de 1 a 2 días hábiles." }, { title: "Envío del producto", description: "Si el error fue nuestro, coordinamos recojo sin costo. Si es por arrepentimiento, el retorno lo asume el cliente." }, { title: "Reembolso o cambio", description: "Recibido y verificado el producto, realizamos el reembolso por el mismo medio de pago o enviamos el producto de cambio." }]} /> },
        { title: "Garantía de productos", content: <p>Todos los productos cuentan con garantía del fabricante. Para activar garantía por defecto de fábrica, contáctanos y gestionaremos el proceso con la marca directamente. La cobertura y plazo de garantía dependen de las condiciones establecidas por cada fabricante y del tipo de producto.</p> },
        { title: "Reembolsos", content: <p>Los reembolsos se procesan luego de verificar el estado del producto. El plazo de abono puede variar según el banco, billetera digital o pasarela de pago utilizada.</p> },
      ]}
    />
  );
}
