import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  HelpCircle,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

import { buildWhatsAppAdvisorUrl } from "../data/products";
import { getProducts } from "../lib/productService";
import type { Product } from "../data/products";

const brandInfo: Record<
  string,
  {
    description: string;
    idealFor: string;
    level: string;
  }
> = {
  Poker: {
    description:
      "Guantes de arquero diseñados para ofrecer agarre, protección y seguridad en cada atajada.",
    idealFor: "Agarre y protección",
    level: "Todos los niveles",
  },

  POKER: {
    description:
      "Guantes de arquero diseñados para ofrecer agarre, protección y seguridad en cada atajada.",
    idealFor: "Agarre y protección",
    level: "Todos los niveles",
  },

  "181 Keepers": {
    description:
      "Equipamiento especializado para arqueros que buscan comodidad, movilidad y rendimiento competitivo.",
    idealFor: "Rendimiento",
    level: "Intermedio - Avanzado",
  },

  "181 KEEPERS": {
    description:
      "Equipamiento especializado para arqueros que buscan comodidad, movilidad y rendimiento competitivo.",
    idealFor: "Rendimiento",
    level: "Intermedio - Avanzado",
  },

  "181Keepers": {
    description:
      "Equipamiento especializado para arqueros que buscan comodidad, movilidad y rendimiento competitivo.",
    idealFor: "Rendimiento",
    level: "Intermedio - Avanzado",
  },
};

const defaultBrandInfo = {
  description:
    "Productos seleccionados para arqueros que buscan calidad, seguridad y rendimiento en cada partido.",
  idealFor: "Todo tipo de arquero",
  level: "Todos los niveles",
};

export default function Brands() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  const normalizeBrand = (value?: string) =>
    value?.trim().toLowerCase() ?? "";

  const availableBrands = useMemo(() => {
    return Array.from(
      new Set(
        dbProducts
          .map((product) => product.brand?.trim())
          .filter((brand): brand is string => Boolean(brand)),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [dbProducts]);

  useEffect(() => {
    getProducts()
      .then(setDbProducts)
      .catch((error) => {
        console.error("Error cargando productos:", error);
        setDbProducts([]);
      });
  }, []);

  const getBrandInfo = (brand: string) => {
    const directInfo = brandInfo[brand];

    if (directInfo) {
      return directInfo;
    }

    const normalized = normalizeBrand(brand);

    if (normalized.includes("181")) {
      return brandInfo["181 Keepers"];
    }

    if (normalized.includes("poker")) {
      return brandInfo["Poker"];
    }

    return defaultBrandInfo;
  };

  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="border-b border-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-24">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-[#FF3945]">
              Marcas oficiales
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black uppercase leading-[0.95] tracking-tight text-neutral-950 md:text-6xl">
              Marcas para defender cada balón
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-600 md:text-lg">
              Encuentra guantes y equipamiento para arquero de marcas
              especializadas como Poker y 181 Keepers. Productos pensados para
              ofrecer agarre, protección y confianza bajo los tres palos.
            </p>

            <a
              href="#marcas-destacadas"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#FF3945] px-7 py-3 text-sm font-black uppercase text-white transition hover:bg-neutral-950"
            >
              Explorar marcas
              <ArrowRight size={18} />
            </a>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-sm font-bold text-neutral-700">
              <div className="flex items-center gap-2">
                <BadgeCheck size={18} className="text-[#FF3945]" />
                Productos originales
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#FF3945]" />
                Compra segura
              </div>

              <div className="flex items-center gap-2">
                <Truck size={18} className="text-[#FF3945]" />
                Envíos a todo Perú
              </div>
            </div>
          </div>

          {/* RESUMEN MARCAS */}
          <div className="rounded-[2rem] border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              {(availableBrands.length > 0
                ? availableBrands.slice(0, 4)
                : ["POKER", "181 KEEPERS"]
              ).map((brand) => (
                <Link
                  key={brand}
                  to={`/guantes?brand=${encodeURIComponent(brand)}`}
                  className="flex min-h-[120px] items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 text-center transition hover:-translate-y-1 hover:border-[#FF3945] hover:shadow-lg"
                >
                  <span className="text-xl font-black uppercase text-neutral-950">
                    {brand}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section id="marcas-destacadas" className="bg-neutral-50 py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#FF3945]">
              Equipamiento especializado
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase text-neutral-950 md:text-5xl">
              Marcas destacadas
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-neutral-500">
              Elige la marca que mejor se adapte a tu estilo, nivel de juego y
              necesidades bajo el arco.
            </p>
          </div>

          {availableBrands.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {availableBrands.map((brand) => {
                const totalProducts = dbProducts.filter(
                  (product) =>
                    normalizeBrand(product.brand) === normalizeBrand(brand),
                ).length;

                const info = getBrandInfo(brand);

                return (
                  <Link
                    key={brand}
                    to={`/guantes?brand=${encodeURIComponent(brand)}`}
                    className="group rounded-[1.7rem] border border-neutral-200 bg-white p-6 transition hover:-translate-y-1 hover:border-[#FF3945] hover:shadow-xl"
                  >
                    <div className="flex h-28 items-center justify-center rounded-2xl bg-neutral-950 px-5">
                      <span className="text-2xl font-black uppercase text-white">
                        {brand}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-black uppercase">
                      {brand}
                    </h3>

                    <p className="mt-3 min-h-[72px] text-sm leading-6 text-neutral-500">
                      {info.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-700">
                        {totalProducts}{" "}
                        {totalProducts === 1 ? "producto" : "productos"}
                      </span>

                      <span className="rounded-full border bg-neutral-50 px-3 py-1 text-xs font-bold text-neutral-700">
                        {info.idealFor}
                      </span>
                    </div>

                    <div className="mt-6 flex items-center gap-2 text-sm font-black uppercase text-[#FF3945]">
                      Ver colección
                      <ArrowRight
                        size={17}
                        className="transition group-hover:translate-x-1"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-12 rounded-[2rem] border border-dashed border-neutral-300 bg-white p-10 text-center">
              <p className="font-bold text-neutral-700">
                Aún no hay marcas registradas.
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                Las marcas aparecerán automáticamente cuando registres
                productos desde el panel administrador.
              </p>
            </div>
          )}

          {/* COMPARATIVA + BENEFICIOS */}
          <div className="mt-20 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] bg-neutral-950 p-8 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF3945]">
                Guía rápida
              </p>

              <h3 className="mt-3 text-3xl font-black uppercase">
                ¿Qué marca elegir?
              </h3>

              <p className="mt-4 text-white/70">
                Cada arquero tiene necesidades distintas. Compara rápidamente
                las marcas disponibles y encuentra la opción que mejor se adapte
                a tu juego.
              </p>

              <div className="mt-8 space-y-4">
                {(availableBrands.length > 0
                  ? availableBrands
                  : ["POKER", "181 KEEPERS"]
                ).map((brand) => {
                  const info = getBrandInfo(brand);

                  return (
                    <div
                      key={brand}
                      className="grid gap-3 rounded-2xl bg-white/10 p-4 sm:grid-cols-3"
                    >
                      <strong className="uppercase">{brand}</strong>
                      <span className="text-white/70">{info.idealFor}</span>
                      <span className="text-white/70">{info.level}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-neutral-200 bg-white p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#FF3945]">
                Beneficios
              </p>

              <h3 className="mt-3 text-3xl font-black uppercase">
                Compra con confianza
              </h3>

              <div className="mt-8 grid gap-4">
                <Benefit
                  icon={<BadgeCheck />}
                  title="Productos originales"
                  text="Trabajamos con marcas y productos seleccionados para arqueros."
                />

                <Benefit
                  icon={<ShieldCheck />}
                  title="Compra segura"
                  text="Compra con respaldo y atención durante todo el proceso."
                />

                <Benefit
                  icon={<Truck />}
                  title="Envíos a todo Perú"
                  text="Recibe tus guantes y equipamiento de forma rápida y segura."
                />

                <Benefit
                  icon={<Sparkles />}
                  title="Asesoría personalizada"
                  text="Te ayudamos a elegir talla, corte y modelo según tus necesidades."
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-20 rounded-[2rem] bg-[#FF3945] p-8 text-center text-white lg:p-12">
            <HelpCircle className="mx-auto mb-4" size={42} />

            <h3 className="text-3xl font-black uppercase">
              ¿No sabes qué guante elegir?
            </h3>

            <p className="mx-auto mt-4 max-w-2xl text-white/90">
              Escríbenos por WhatsApp y te ayudamos a encontrar el guante ideal
              según tu talla, tipo de corte, nivel de juego y presupuesto.
            </p>

            <a
              href={buildWhatsAppAdvisorUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-black uppercase text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
            >
              <MessageCircle size={18} />
              Pedir asesoría
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function Benefit({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4 rounded-2xl bg-neutral-50 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#FF3945]/25 text-[#FF3945]">
        {icon}
      </div>

      <div>
        <h4 className="font-black uppercase text-neutral-950">{title}</h4>
        <p className="mt-1 text-sm leading-6 text-neutral-500">{text}</p>
      </div>
    </div>
  );
}