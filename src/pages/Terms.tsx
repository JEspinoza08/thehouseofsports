import LegalPage, { LegalList } from "./LegalPage";

export default function Terms() {
  return (
    <LegalPage
      eyebrow="Páginas legales"
      title="Términos y Condiciones"
      subtitle="Reglas de uso y compra aplicables a la experiencia de compra en thehouseofsports.pe."
      updated="Enero 2026"
      icon="terms"
      sections={[
        {
          title: "Información del proveedor",
          content: (
            <p>
              The House of Sports Perú, con RUC 10422446503, con domicilio en Ate, Peru, 15011. Correo: admi.ths.pe@gmail.com · Teléfono: +51 993 834 954.
            </p>
          ),
        },
        {
          title: "Uso del sitio",
          content: (
            <p>
              El sitio thehouseofsports.pe está destinado exclusivamente a usuarios
              mayores de 18 años o con autorización de sus tutores. Queda
              prohibido usar el sitio para actividades ilegales, fraudulentas o
              que violen derechos de terceros.
            </p>
          ),
        },
        {
          title: "Productos y precios",
          content: (
            <p>
              Todos los precios están expresados en Soles Peruanos (S/.) e
              incluyen IGV. Nos reservamos el derecho de modificar precios sin
              previo aviso, salvo para órdenes ya confirmadas. Las imágenes de
              productos son referenciales; el color final puede variar
              ligeramente.
            </p>
          ),
        },
        {
          title: "Proceso de compra",
          content: (
            <p>
              La compra se perfecciona cuando recibes la confirmación por correo
              electrónico y el pago ha sido procesado exitosamente. Nos
              reservamos el derecho de cancelar pedidos en caso de error de
              precio, stock agotado o indicios de fraude, con devolución total
              del importe pagado.
            </p>
          ),
        },
        {
          title: "Disponibilidad",
          content: (
            <p>
              El stock mostrado busca mantenerse actualizado. En caso
              excepcional de discrepancia, te contactaremos dentro de las 24
              horas para ofrecerte un producto alternativo o la devolución
              íntegra.
            </p>
          ),
        },
        {
          title: "Propiedad intelectual",
          content: (
            <p>
              Todos los contenidos del sitio, incluyendo logos, textos, imágenes
              y diseño, son propiedad de The House of Sports Perú o de sus proveedores y
              están protegidos por la legislación peruana de propiedad
              intelectual.
            </p>
          ),
        },
        {
          title: "Limitación de responsabilidad",
          content: (
            <p>
              The House of Sports no será responsable por daños indirectos, pérdidas de
              datos o perjuicios derivados del uso del sitio. Nuestra
              responsabilidad máxima se limita al valor del producto adquirido.
            </p>
          ),
        },
        {
          title: "Ley aplicable",
          content: (
            <LegalList
              items={[
                "Estos términos se rigen por las leyes de la República del Perú.",
                "Cualquier controversia se someterá a la jurisdicción de los tribunales de Lima.",
                "El consumidor conserva su derecho de acudir al Indecopi cuando corresponda.",
              ]}
            />
          ),
        },
      ]}
    />
  );
}
