import LegalPage, { LegalList, LegalTable, TimelineNote } from "./LegalPage";

export default function Shipping() {
  return (
    <LegalPage
      eyebrow="Envíos a todo el Perú"
      title="Política de Envíos"
      subtitle="Entrega inmediata en Lima para pedidos confirmados antes de las 2:00 PM en días hábiles."
      updated="Enero 2026"
      icon="shipping"
      sections={[
        {
          title: "Cobertura de envíos",
          content: (
            <LegalList
              items={[
                "Lima Metropolitana: entrega el mismo día para pedidos antes de las 2:00 PM o al día siguiente hábil.",
                "Lima Provincias y Callao: 1 a 2 días hábiles.",
                "Provincias del Perú: 3 a 5 días hábiles según destino.",
                "Zonas alejadas de selva o sierra alta: 5 a 8 días hábiles, previa coordinación.",
              ]}
            />
          ),
        },
        {
          title: "Tarifas de envío",
          content: (
            <LegalTable
              rows={[
                ["Destino", "Tarifa estándar"],
                ["Lima Metropolitana", "S/. 10 – S/. 15"],
                ["Lima Provincias", "S/. 15 – S/. 25"],
                ["Provincias", "S/. 25 – S/. 45"],
                ["Pedidos desde S/. 400", "ENVÍO GRATIS a todo el Perú"],
              ]}
            />
          ),
        },
        {
          title: "Envío gratis desde S/. 400",
          content: (
            <TimelineNote>
              Los pedidos con un subtotal de productos igual o mayor a S/. 400 tienen envío gratis a todo el Perú. El beneficio se aplica automáticamente durante el checkout.
            </TimelineNote>
          ),
        },
        {
          title: "Seguimiento del pedido",
          content: (
            <TimelineNote>
              Una vez despachado tu pedido, recibirás por email y/o WhatsApp el
              número de guía, empresa transportista y enlace de rastreo cuando
              esté disponible.
            </TimelineNote>
          ),
        },
        {
          title: "Problemas con la entrega",
          content: (
            <LegalList
              items={[
                "Paquete dañado: toma fotos antes de abrir y contáctanos dentro de las 24 horas de recibido.",
                "Paquete perdido: abriremos una investigación con el transportista. Si no se localiza en 10 días hábiles, coordinaremos reemplazo o reembolso.",
                "Entrega fallida: el transportista realizará hasta 2 intentos. Una nueva entrega puede generar costo adicional.",
              ]}
            />
          ),
        },
        {
          title: "Responsabilidades",
          content: (
            <p>
              The House of Sports gestiona el despacho desde almacén hasta la entrega al
              operador logístico. En caso de pérdida o daño imputable al
              transportista, acompañaremos el reclamo y la solución
              correspondiente para el cliente.
            </p>
          ),
        },
      ]}
    />
  );
}
