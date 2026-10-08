import { useEffect, useState } from "react";
import {
  Facebook,
  Instagram,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buildWhatsAppAdvisorUrl } from "../data/products";
import { fallbackCategoryLinks, getMainCategoryLinks } from "../services/categoryNavigation";

import logo from "../assets/logo.png";

// Logos de métodos de pago
import visaLogo from "../assets/logos/visa.png";
import mastercardLogo from "../assets/logos/mastercard.png";
import amexLogo from "../assets/logos/amex.png";
import yapeLogo from "../assets/logos/yape.png";
import plinLogo from "../assets/logos/plin.png";



const SHOWROOM_MAP_URL =
  "https://maps.app.goo.gl/BL39RvSGYi74szy5A";

function BrandLogo() {
  return (
    <Link
      to="/"
      className="
        flex shrink-0 items-center
        lg:w-[12rem]
        xl:w-[12rem]
      "
      aria-label="The House of Sports"
    >
      <img
        src={logo}
        alt="The House of Sports"
        className="
          h-auto
          w-28
          object-contain
          sm:w-36

          lg:w-[9rem]
          lg:origin-left
          lg:scale-[1.45]

          xl:scale-[1.55]
        "
      />
    </Link>
  );
}

/* TikTok no está disponible en Lucide */
function TikTokIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 1 1-2-2.757V9.419a6.364 6.364 0 1 0 5.445 6.253V8.737a8.182 8.182 0 0 0 4.773 1.526V6.82a4.831 4.831 0 0 1-1.003-.134z" />
    </svg>
  );
}

export default function Footer() {
  const [categoryLinks, setCategoryLinks] = useState(fallbackCategoryLinks);

  useEffect(() => {
    getMainCategoryLinks(6).then(setCategoryLinks).catch(console.error);
  }, []);

  return (
    <footer className="bg-[#080808] text-white">
      <div className="padel-container py-12">
        <div className="grid gap-10 md:grid-cols-4">

          {/* MARCA */}
          <div>
            <BrandLogo />

            <p className="mt-5 text-[13px] leading-relaxed text-white/60">
              Tu tienda especializada en equipamiento deportivo de alto
              rendimiento. Representantes oficiales en Perú de marcas
              internacionales como POKER, TLSS y 181 KEEPERS.
            </p>

            {/* REDES SOCIALES */}
            <div className="mt-6 flex items-center gap-5 text-white/70">

              {/* INSTAGRAM */}
              <a
                href="https://www.instagram.com/thehouseofsports.pe"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram de The House of Sports"
                title="Instagram"
                className="transition-all duration-200 hover:scale-110 hover:text-[#e3262e]"
              >
                <Instagram size={25} strokeWidth={2} />
              </a>

              {/* FACEBOOK */}
              <a
                href="https://www.facebook.com/thehouseofsports.pe/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook de The House of Sports"
                title="Facebook"
                className="transition-all duration-200 hover:scale-110 hover:text-[#e3262e]"
              >
                <Facebook size={25} strokeWidth={2} />
              </a>

              {/* TIKTOK */}
              <a
                href="https://www.tiktok.com/@ths.pe"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok de The House of Sports"
                title="TikTok"
                className="transition-all duration-200 hover:scale-110 hover:text-[#e3262e]"
              >
                <TikTokIcon size={25} />
              </a>

              {/* WHATSAPP */}
              <a
                href={buildWhatsAppAdvisorUrl()}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp de The House of Sports"
                title="WhatsApp"
                className="transition-all duration-200 hover:scale-110 hover:text-[#25D366]"
              >
                <MessageCircle size={26} strokeWidth={2} />
              </a>
            </div>
          </div>

          {/* CATEGORÍAS */}
          <div>
            <h3 className="text-[13px] font-black uppercase">
              Categorías
            </h3>

            <div className="mt-4 space-y-2">
              {categoryLinks.map((l) => (
                <Link
                  key={l.href}
                  to={l.href}
                  className="block text-[13px] text-white/60 transition-colors hover:text-[#e3262e]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* INFORMACIÓN */}
          <div>
            <h3 className="text-[13px] font-black uppercase">
              Información
            </h3>

            <div className="mt-4 space-y-2">
              <Link
                to="/nosotros"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Quiénes somos
              </Link>

              <Link
                to="/blog"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Blog y novedades
              </Link>

              <Link
                to="/preguntas-frecuentes"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Preguntas frecuentes
              </Link>

              <Link
                to="/terminos-y-condiciones"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Términos y condiciones
              </Link>

              <Link
                to="/politica-de-privacidad"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Política de privacidad
              </Link>

              <Link
                to="/politica-de-envios"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Política de envíos
              </Link>

              <Link
                to="/cambios-y-devoluciones"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Cambios y devoluciones
              </Link>

              <Link
                to="/libro-de-reclamaciones"
                className="block text-[13px] text-white/60 hover:text-[#e3262e]"
              >
                Libro de reclamaciones
              </Link>
            </div>
          </div>

          {/* CONTACTO */}
          <div>
            <h3 className="text-[13px] font-black uppercase">
              Contacto
            </h3>

            <div className="mt-4 space-y-2 text-[13px] text-white/60">
              <p>WhatsApp: +51 993 834 954</p>
              <p>Email: admi.ths.pe@gmail.com</p>
              <p>Envíos a todo el Perú</p>
            </div>

            {/* SHOWROOM */}
            <a
              href={SHOWROOM_MAP_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Visita nuestro showroom"
              className="
                group mt-5 flex w-full max-w-[250px]
                items-center gap-3 rounded-lg
                border border-white/15 bg-white/[0.06]
                px-4 py-3
                transition-all duration-200
                hover:border-[#e3262e]/60
                hover:bg-[#e3262e]
              "
            >
              <div
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-full bg-[#e3262e]
                  text-white
                  transition-colors
                  group-hover:bg-white
                  group-hover:text-[#e3262e]
                "
              >
                <MapPin size={18} strokeWidth={2.5} />
              </div>

              <div>
                <span className="block text-[11px] font-medium uppercase tracking-wide text-white/50 group-hover:text-white/80">
                  Conoce nuestra tienda
                </span>

                <span className="block text-[12px] font-black uppercase text-white">
                  Visita nuestro showroom
                </span>
              </div>
            </a>

            {/* MÉTODOS DE PAGO */}
<div className="mt-7">
  <div className="text-[12px] font-black uppercase text-white">
    Métodos de pago
  </div>

  <p className="mt-1 text-[11px] text-white/50">
    Tarjetas de crédito, débito y billeteras digitales
  </p>

  <div className="mt-4 flex flex-wrap items-center gap-2">

    {/* VISA */}
    <div
      className="
        flex h-[46px] w-[68px]
        items-center justify-center
        rounded-md bg-white
        px-2
      "
      title="Visa"
    >
      <img
        src={visaLogo}
        alt="Visa"
        className="max-h-[30px] max-w-full object-contain"
      />
    </div>

    {/* MASTERCARD */}
    <div
      className="
        flex h-[46px] w-[68px]
        items-center justify-center
        rounded-md bg-white
        px-2
      "
      title="Mastercard"
    >
      <img
        src={mastercardLogo}
        alt="Mastercard"
        className="max-h-[32px] max-w-full object-contain"
      />
    </div>

    {/* AMERICAN EXPRESS */}
    <div
      className="
        flex h-[46px] w-[68px]
        items-center justify-center
        rounded-md bg-white
        px-2
      "
      title="American Express"
    >
      <img
        src={amexLogo}
        alt="American Express"
        className="max-h-[32px] max-w-full object-contain"
      />
    </div>

    {/* YAPE */}
    <div
      className="
        flex h-[46px] w-[68px]
        items-center justify-center
        rounded-md bg-white
        px-2
      "
      title="Yape"
    >
      <img
        src={yapeLogo}
        alt="Yape"
        className="max-h-[34px] max-w-full object-contain"
      />
    </div>

    {/* PLIN */}
    <div
      className="
        flex h-[46px] w-[68px]
        items-center justify-center
        rounded-md bg-white
        px-2
      "
      title="Plin"
    >
      <img
        src={plinLogo}
        alt="Plin"
        className="max-h-[34px] max-w-full object-contain"
      />
    </div>

  </div>
</div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="mt-10 border-t border-white/10 pt-6 text-[12px] text-white/40">
          © 2026 The House of Sports Perú. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}