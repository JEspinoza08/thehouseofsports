import LegalPage from "./LegalPage";

export default function Faq() {
  return (
    <LegalPage
      eyebrow="Ayuda rápida"
      title="Preguntas Frecuentes"
      subtitle="Respuestas rápidas para comprar con mayor seguridad en The House of Sports Perú."
      icon="faq"
      sections={[
        { title: "¿Realizan envíos a todo el Perú?", content: <p>Sí. Enviamos a Lima Metropolitana, Callao, Lima Provincias y el resto del Perú mediante operadores logísticos según destino.</p> },
        { title: "¿Cuánto demora mi pedido?", content: <p>En Lima puede llegar el mismo día o al siguiente día hábil. En provincias, el plazo usual es de 3 a 5 días hábiles, dependiendo del destino.</p> },
        { title: "¿Qué medios de pago aceptan?", content: <p>Aceptamos pagos con tarjeta, transferencia interbancaria, Yape y Plin. Las pasarelas de pago se mostrarán durante el checkout.</p> },
        { title: "¿Puedo cambiar una talla?", content: <p>Sí, los cambios de talla en zapatillas y ropa están sujetos a disponibilidad de stock y a que el producto esté sin uso, con empaque y comprobante.</p> },
        { title: "¿Los productos tienen garantía?", content: <p>Sí. Los productos cuentan con garantía de hasta 3 meses. Para defectos de fábrica, escríbenos y te ayudaremos a gestionar el proceso.</p> },
      ]}
    />
  );
}
