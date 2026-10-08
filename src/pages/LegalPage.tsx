import { ReactNode, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle2, Clock, FileText, LockKeyhole, PackageCheck, RefreshCcw, ShieldCheck } from "lucide-react";

type LegalSection = {
  title: string;
  content: ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  updated?: string;
  icon: "terms" | "privacy" | "shipping" | "returns" | "claims" | "faq" | "about";
  sections: LegalSection[];
};

const iconMap = {
  terms: FileText,
  privacy: LockKeyhole,
  shipping: PackageCheck,
  returns: RefreshCcw,
  claims: ShieldCheck,
  faq: CheckCircle2,
  about: ShieldCheck,
};

export default function LegalPage({ eyebrow, title, subtitle, updated, icon, sections }: LegalPageProps) {
  const Icon = iconMap[icon];

  useEffect(() => {
    document.title = `${title} | The House of Sports Perú`;
  }, [title]);

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Header onSearch={() => {}} />

      <main>
        <section className="bg-neutral-950 px-6 pb-14 pt-28 text-white lg:pb-20">
          <div className="padel-container">
            <div className="flex max-w-4xl flex-col gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3262e] text-white shadow-lg shadow-[#e3262e]/20">
                <Icon size={28} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#e3262e]">{eyebrow}</p>
                <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">{subtitle}</p>
                {updated && <p className="mt-4 text-sm font-bold text-white/50">Última actualización: {updated}</p>}
              </div>
            </div>
          </div>
        </section>

        {/* <section className="border-b border-amber-200 bg-amber-50 px-6 py-4 text-amber-900">
          <div className="padel-container flex gap-3 text-sm leading-relaxed">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} />
            <p>
              Este contenido fue preparado como base operativa para comercio electrónico en Perú. No reemplaza asesoría legal profesional y puede ser revisado por un abogado cuando el negocio lo considere necesario.
            </p>
          </div>
        </section> */}

        <section className="px-6 py-12 lg:py-16">
          <div className="padel-container grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-28 rounded-3xl border border-neutral-200 bg-neutral-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-500">Contenido</p>
                <div className="mt-4 space-y-2">
                  {sections.map((section, index) => (
                    <a key={section.title} href={`#section-${index + 1}`} className="block rounded-xl px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-white hover:text-[#e3262e]">
                      {index + 1}. {section.title}
                    </a>
                  ))}
                </div>
              </div>
            </aside>

            <div className="mx-auto w-full max-w-4xl space-y-6">
              {sections.map((section, index) => (
                <article key={section.title} id={`section-${index + 1}`} className="scroll-mt-28 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
                  <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-neutral-950">
                    {index + 1}. {section.title}
                  </h2>
                  <div className="legal-copy mt-5 text-sm leading-7 text-neutral-700 md:text-base">
                    {section.content}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export const LegalList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2">
    {items.map((item) => (
      <li key={item} className="flex gap-2">
        <CheckCircle2 className="mt-1 shrink-0 text-[#e3262e]" size={16} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const LegalTable = ({ rows }: { rows: string[][] }) => (
  <div className="overflow-hidden rounded-2xl border border-neutral-200">
    <table className="w-full min-w-[560px] text-left text-sm">
      <thead className="bg-neutral-950 text-white">
        <tr>
          {rows[0].map((cell) => (
            <th key={cell} className="px-4 py-3 font-black uppercase">{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.slice(1).map((row, rowIndex) => (
          <tr key={row.join("-")} className={rowIndex % 2 === 0 ? "bg-white" : "bg-neutral-50"}>
            {row.map((cell) => (
              <td key={cell} className="border-t border-neutral-200 px-4 py-3">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const ProcessSteps = ({ steps }: { steps: { title: string; description: string }[] }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {steps.map((step, index) => (
      <div key={step.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#e3262e] text-sm font-black text-white">
          {index + 1}
        </div>
        <h3 className="font-black uppercase text-neutral-950">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-neutral-600">{step.description}</p>
      </div>
    ))}
  </div>
);

export const TimelineNote = ({ children }: { children: ReactNode }) => (
  <div className="flex gap-3 rounded-2xl bg-neutral-50 p-4 text-neutral-700">
    <Clock className="mt-1 shrink-0 text-[#e3262e]" size={18} />
    <p>{children}</p>
  </div>
);
