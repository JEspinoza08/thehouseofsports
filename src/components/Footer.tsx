import { Instagram, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { buildWhatsAppAdvisorUrl } from "../data/products";
const links = [
  { label: "Guantes", href: "/guantes" },
  { label: "Zapatillas", href: "/zapatillas" },
  { label: "Ropa", href: "/ropa" },
  { label: "Accesorios", href: "/accesorios" },
  { label: "Ofertas", href: "/ofertas" },
  { label: "Marcas", href: "/marcas" },
];
function BrandLogo() {
  return (
    <span className="text-[23px] font-black tracking-[-0.05em]">
      <span className="text-[#e3262e]">The House of Sports</span>
    </span>
  );
}
export default function Footer() {
  return (
    <footer className="bg-[#080808] text-white">
      <div className="padel-container py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <BrandLogo />
            <p className="mt-5 text-[13px] leading-relaxed text-white/60">
              Tu tienda especialista en guantes para arqueros. Las mejores marcas y productos
              para tu juego.
            </p>
            <div className="mt-6 flex gap-4 text-white/70">
              <a
                href="https://instagram.com/thehouseofsports.pe"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#e3262e]"
              >
                <Instagram size={18} />
              </a>
              <a
                href={buildWhatsAppAdvisorUrl()}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#e3262e]"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase">Categorías</h3>
            <div className="mt-4 space-y-2">
              {links.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="block text-[13px] text-white/60 hover:text-[#e3262e]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase">Información</h3>
            <div className="mt-4 space-y-2">
              <Link to="/nosotros" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Quiénes somos</Link>
              <Link to="/blog" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Blog y novedades</Link>
              <Link to="/preguntas-frecuentes" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Preguntas frecuentes</Link>
              <Link to="/terminos-y-condiciones" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Términos y condiciones</Link>
              <Link to="/politica-de-privacidad" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Política de privacidad</Link>
              <Link to="/politica-de-envios" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Política de envíos</Link>
              <Link to="/cambios-y-devoluciones" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Cambios y devoluciones</Link>
              <Link to="/libro-de-reclamaciones" className="block text-[13px] text-white/60 hover:text-[#e3262e]">Libro de reclamaciones</Link>
            </div>
          </div>
          <div>
            <h3 className="text-[13px] font-black uppercase">Contacto</h3>
            <div className="mt-4 space-y-2 text-[13px] text-white/60">
              <p>WhatsApp: +51 993 834 954</p>
              <p>Email: admi.ths.pe@gmail.com</p>
              <p>Envíos a todo el Perú</p>
            </div>
            <div className="mt-6 text-[12px] font-black uppercase text-white">
              Pagos con Tarjeta | Crédito & Débito
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-[12px] text-white/40">
          © 2026 The House of Sports Perú. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
