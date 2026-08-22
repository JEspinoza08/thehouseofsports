import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import bg from "../assets/brand-finder-bg.webp";
import poker from "../assets/brand-poker.webp";
import tlss from "../assets/brand-tlss.webp";
import keepers from "../assets/brand-181.webp";
const brands = [
  {
    name: "POKER",
    category: "GUANTES DE ARQUERO",
    text: "Tecnología, agarre y rendimiento desarrollados para responder bajo los tres palos.",
    href: "/guantes?brand=POKER",
    image: poker,
    accent: "#c8923b",
  },
  {
    name: "TLSS",
    category: "CHIMPUNES",
    text: "Tecnología, materiales premium y diseño para diferentes estilos de juego.",
    href: "/zapatillas?brand=TLSS",
    image: tlss,
    accent: "#e3262e",
  },
  {
    name: "181 KEEPERS",
    category: "PROTECCIONES",
    text: "Protección de alto rendimiento diseñada para ofrecer seguridad, comodidad y libertad de movimiento.",
    href: "/categoria/protecciones?brand=181%20KEEPERS",
    image: keepers,
    accent: "#e3262e",
  },
];
export default function BrandFinder() {
  return (
    <section className="relative overflow-hidden bg-[#090a0b] py-12 text-white lg:py-20">
      <div
        className="absolute inset-0 bg-cover bg-left opacity-55 contrast-125 saturate-75"
        style={{ backgroundImage: `url(${bg})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,8,9,.62)_0%,rgba(7,8,9,.72)_34%,rgba(7,8,9,.9)_54%,rgba(7,8,9,.97)_100%)]" />
      <div className="padel-container relative">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_2.2fr]">
          <div className="flex flex-col justify-center py-4 lg:pr-8">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#e3262e]">
              Marcas internacionales · seleccionadas por THS
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase italic tracking-[-.055em] lg:text-5xl">
              ¿No sabes qué elegir?
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-white/70">
              En THS reunimos marcas internacionales seleccionadas por su
              calidad, tecnología y rendimiento. Como distribuidores
              especializados, acercamos al Perú productos desarrollados para
              quienes buscan competir, mejorar y llevar su juego al siguiente
              nivel.
            </p>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Descubre POKER, TLSS y 181 KEEPERS y encuentra la marca que mejor
              se adapta a ti.
            </p>
            <Link
              to="/marcas"
              className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-[#e3262e] px-5 py-3 text-[11px] font-black uppercase"
            >
              Ver todas las marcas <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {brands.map((b) => (
              <Link
                key={b.name}
                to={b.href}
                className="group relative min-h-[420px] overflow-hidden rounded-2xl border border-white/20 bg-black/80 shadow-[0_18px_45px_rgba(0,0,0,.38)] backdrop-blur-[1px] transition hover:-translate-y-1 hover:border-[#e3262e]/70"
              >
                <img
                  src={b.image}
                  alt={b.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[9px] font-black uppercase tracking-[.14em] text-[#e3262e]">
                    {b.name}
                  </p>
                  <h3 className="mt-2 text-xl font-black uppercase">
                    {b.category}
                  </h3>
                  <p className="mt-3 text-xs leading-5 text-white/70">
                    {b.text}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase">
                    Descubrir {b.name} <ArrowRight size={13} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
