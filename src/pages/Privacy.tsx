import LegalPage, { LegalList } from "./LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      eyebrow="Protección de datos"
      title="Política de Privacidad"
      subtitle="Tratamiento de datos personales conforme a la Ley N° 29733 y normativa peruana aplicable."
      updated="Enero 2026"
      icon="privacy"
      sections={[
        { title: "Responsable del tratamiento", content: <p>The House of Sports Perú, RUC 10422446503, dirección Ate, Peru, 15011, correo: admi.ths.pe@gmail.com. El banco de datos personales será gestionado conforme a la normativa peruana vigente.</p> },
        { title: "Datos que recopilamos", content: <LegalList items={["Datos de registro: nombre completo, correo, teléfono y contraseña encriptada.", "Datos de compra: dirección de envío y método de pago. No almacenamos números de tarjeta completos.", "Datos de navegación: cookies, dirección IP, páginas visitadas y dispositivo.", "Datos de contacto: mensajes enviados por WhatsApp, email o formulario de contacto."]} /> },
        { title: "Finalidad del tratamiento", content: <LegalList items={["Gestionar tus pedidos y realizar entregas.", "Enviarte confirmaciones, actualizaciones de estado y comprobantes.", "Mejorar nuestros servicios y personalizar tu experiencia.", "Enviar comunicaciones de marketing solo si brindas consentimiento.", "Cumplir obligaciones legales, fiscales y atender reclamos."]} /> },
        { title: "Compartición de datos", content: <p>Solo compartimos tus datos con empresas de transporte para realizar entregas, pasarelas de pago para procesar transacciones y autoridades peruanas cuando sea legalmente requerido. No vendemos ni cedemos datos a terceros con fines comerciales.</p> },
        { title: "Seguridad", content: <p>Implementamos cifrado SSL, acceso restringido por rol y copias de seguridad periódicas. El pago se procesa mediante pasarelas que aplican estándares de seguridad para transacciones digitales.</p> },
        { title: "Tus derechos ARCO", content: <p>Tienes derecho de Acceso, Rectificación, Cancelación y Oposición al tratamiento de tus datos. Envía tu solicitud a admi.ths.pe@gmail.com indicando “Solicitud ARCO” en el asunto. Responderemos en un plazo máximo de 20 días hábiles.</p> },
        { title: "Cookies", content: <p>Utilizamos cookies propias para funcionalidad y carrito, así como cookies de terceros como Google Analytics o Meta Pixel cuando estén habilitadas. Puedes gestionar tus preferencias desde el navegador o el banner de cookies.</p> },
        { title: "Conservación de datos", content: <p>Conservamos tus datos durante la relación comercial y hasta 5 años después por obligaciones contables y fiscales. Los datos del Libro de Reclamaciones se conservan por el plazo exigido por la normativa aplicable.</p> },
      ]}
    />
  );
}
