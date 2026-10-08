import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { buildWhatsAppAdvisorUrl } from "../data/products";
import poker from "../assets/logos/poker.png";
import tlss from "../assets/logos/tlss.png";
import keepers from "../assets/logos/181.png";

const brands = [
  {
    name: "POKER",
    image: poker,
    category: "Guantes de Arquero",
    tag: "De Brasil para toda América",
    to: "/guantes?brand=POKER",

    logoBg: "bg-white",
    logoBorder: "border-neutral-200",
    imageClass: "brightness-100",
    accent: "#e3262e",

    body: (
      <>
        <p>
          Nacida en Brasil en 1986, POKER construyó casi cuatro décadas de
          historia dentro del deporte hasta convertirse en una de las grandes
          referencias latinoamericanas en guantes de arquero.
        </p>

        <p>
          Su línea profesional combina desarrollo tecnológico, látex de alto
          rendimiento y la experiencia directa de arqueros que compiten al
          máximo nivel.
        </p>

        <p>
          En Perú, THS acerca esta experiencia a arqueros que buscan agarre,
          confianza y tecnología profesional para competir sin importar el nivel.
        </p>
      </>
    ),
  },

  {
    name: "TLSS",
    image: tlss,
    category: "Chimpunes de Fútbol",
    tag: "Tecnología para una nueva generación de futbolistas",
    to: "/zapatillas?brand=TLSS",

    logoBg:
      "bg-gradient-to-br from-neutral-50 via-white to-neutral-100",
    logoBorder: "border-neutral-200",
    imageClass: "brightness-100",
    accent: "#111111",

    body: (
      <>
        <p>
          Fundada en China en 2018, TLSS representa una nueva generación de
          marcas especializadas en fútbol.
        </p>

        <p>
          Desarrolla siluetas como TACTICIAN, LIBERO, SWEEPER y STRIKER,
          incorporando materiales premium, fibra de carbono, KaRVO® y sistemas
          de amortiguación, tracción y estabilidad.
        </p>

        <p>
          THS presenta TLSS en Perú para jugadores que buscan tecnología,
          diseño y rendimiento alrededor de su forma de jugar.
        </p>
      </>
    ),
  },

  {
    name: "181 KEEPERS",
    image: keepers,
    category: "Protecciones Deportivas",
    tag: "Hecha por atletas, para atletas",
    to: "/accesorios?brand=181%20KEEPERS",

    logoBg:
      "bg-gradient-to-br from-neutral-50 via-white to-neutral-100",
    logoBorder: "border-neutral-200",
    imageClass: "brightness-100",
    accent: "#111111",

    body: (
      <>
        <p>
          181 KEEPERS nació en Portugal en 2014 para crear protecciones
          deportivas capaces de soportar la exigencia de la competencia sin
          sacrificar movilidad ni comodidad.
        </p>

        <p>
          Sus rodilleras y coderas se centran en flexibilidad, ajuste, ligereza
          y resistencia para deportes de alto impacto.
        </p>

        <p>
          THS trae 181 KEEPERS al Perú para deportistas que quieren competir con
          máxima protección, confianza y libertad de movimiento.
        </p>
      </>
    ),
  },
];
export default function Brands() {
  return (
    <main className="bg-white">
      <section className="border-b border-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[.2em] text-[#e3262e]">
              Marcas oficiales
            </p>
            <h1 className="mt-5 text-5xl font-black uppercase leading-[.95] tracking-tight md:text-6xl">
              Marcas que llevan tu juego a otro nivel
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">
              En The House of Sports seleccionamos marcas internacionales
              reconocidas por su calidad, tecnología y rendimiento. POKER, TLSS
              y 181 KEEPERS ofrecen equipamiento especializado para jugadores y
              arqueros que buscan competir con mayor confianza, comodidad y
              desempeño.
            </p>
            <a
              href="#conoce-marcas"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e3262e] px-7 py-3 text-sm font-black uppercase text-white"
            >
              Conoce nuestras marcas <ArrowRight size={17} />
            </a>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Mini
                icon={<BadgeCheck />}
                t="Marcas originales"
                d="Productos auténticos y oficiales."
              />
              <Mini
                icon={<Sparkles />}
                t="Calidad internacional"
                d="Tecnología y rendimiento seleccionados."
              />
              <Mini
                icon={<ShieldCheck />}
                t="Respaldo THS"
                d="Asesoría y atención especializada."
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {brands.map((b) => (
              <Link
                key={b.name}
                to={b.to}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-28 items-center justify-center rounded-xl bg-white p-4">
                  <img
                    src={b.image}
                    alt={b.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <b className="mt-4 block text-sm">{b.category}</b>
                <span className="mt-2 flex items-center gap-1 text-xs font-black uppercase text-[#e3262e]">
                  Ver {b.name} <ArrowRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section id="conoce-marcas" className="bg-neutral-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[.22em] text-[#e3262e]">
              Conoce nuestras marcas
            </p>
            <h2 className="mt-3 text-4xl font-black uppercase">
              Tres historias. Tres especialidades.
            </h2>
            <p className="mt-3 text-neutral-500">
              Una misma pasión por el alto rendimiento.
            </p>
          </div>
          <div className="mt-12 grid gap-7 lg:grid-cols-3">
  {brands.map((b) => (
    <article
      key={b.name}
      className="
        group relative flex flex-col overflow-hidden
        rounded-[28px] border border-neutral-200
        bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)]
        transition-all duration-500
        hover:-translate-y-2
        hover:shadow-[0_22px_60px_rgba(0,0,0,0.12)]
      "
    >
      {/* LOGO */}
      <div
        className={`
          relative flex h-52 items-center justify-center
          overflow-hidden border-b p-10
          ${b.logoBg}
          ${b.logoBorder}
        `}
      >
        {/* textura */}
        <div
          className="
            pointer-events-none absolute inset-0
            opacity-[0.035]
            [background-image:radial-gradient(circle_at_center,#000_1px,transparent_1px)]
            [background-size:18px_18px]
          "
        />

        {/* glow */}
        <div
          className="
            absolute left-1/2 top-1/2 h-32 w-32
            -translate-x-1/2 -translate-y-1/2
            rounded-full opacity-0 blur-3xl
            transition-opacity duration-500
            group-hover:opacity-20
          "
          style={{ backgroundColor: b.accent }}
        />

        <img
          src={b.image}
          alt={b.name}
          className={`
            relative z-10 max-h-[95px] max-w-[78%]
            object-contain transition-transform duration-500
            group-hover:scale-105
            ${b.imageClass}
          `}
        />
      </div>

      {/* CONTENIDO */}
      <div className="flex flex-1 flex-col p-7 lg:p-8">

        <div>
          <span
            className="
              inline-flex rounded-full
              bg-neutral-100 px-3 py-1.5
              text-[10px] font-black uppercase
              tracking-[.13em] text-neutral-600
            "
          >
            {b.category}
          </span>

          <h3
            className="
              mt-5 text-[27px] font-black uppercase
              leading-none tracking-tight text-neutral-950
            "
          >
            {b.name}
          </h3>

          <p
            className="
              mt-3 min-h-[34px]
              text-[11px] font-black uppercase
              leading-5 tracking-[.13em]
            "
            style={{ color: b.accent }}
          >
            {b.tag}
          </p>
        </div>

        {/* separador */}
        <div className="my-6 h-px bg-neutral-100" />

        {/* TEXTO */}
        <div
          className="
            flex-1 space-y-4
            text-[14px] leading-7 text-neutral-600
          "
        >
          {b.body}
        </div>

        {/* CTA */}
        <div className="mt-8 border-t border-neutral-100 pt-6">
          <Link
            to={b.to}
            className="
              flex items-center justify-between
              text-xs font-black uppercase
              tracking-[.08em] text-neutral-950
            "
          >
            <span>Explorar {b.name}</span>

            <span
              className="
                flex h-10 w-10 items-center justify-center
                rounded-full text-white
                transition-all duration-300
                group-hover:translate-x-1
              "
              style={{ backgroundColor: b.accent }}
            >
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
      </div>

      {/* línea inferior de marca */}
      <div
        className="
          absolute bottom-0 left-0 h-[3px] w-0
          transition-all duration-500
          group-hover:w-full
        "
        style={{ backgroundColor: b.accent }}
      />
    </article>
  ))}
</div>
          <div className="mt-14 rounded-3xl bg-[#e3262e] p-8 text-center text-white lg:p-12">
            <h3 className="text-3xl font-black uppercase">
              ¿NO SABES QUÉ ELEGIR?
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-white/90">
              Escríbenos por WhatsApp y te ayudamos a encontrar el equipamiento ideal según tu deporte, estilo de juego, talla, necesidades y presupuesto.
            </p>
            <a
              href={buildWhatsAppAdvisorUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-black uppercase text-neutral-950"
            >
              <MessageCircle size={17} /> Pedir asesoría
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
function Mini({ icon, t, d }: { icon: React.ReactNode; t: string; d: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-[#e3262e]">{icon}</span>
      <div>
        <b className="block text-xs uppercase">{t}</b>
        <span className="text-xs text-neutral-500">{d}</span>
      </div>
    </div>
  );
}
