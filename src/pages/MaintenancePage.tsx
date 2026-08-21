import { Clock3, Instagram, ShieldCheck, Sparkles } from "lucide-react";
import logo from "../assets/logo.png";

type Props = {
  title: string;
  message: string;
};

export default function MaintenancePage({ title, message }: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#e3262e]/15 blur-3xl" />
        <div className="absolute -bottom-36 -right-28 h-[28rem] w-[28rem] rounded-full bg-orange-500/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <section className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#e3262e] via-orange-400 to-[#e3262e]" />

          <div className="grid gap-0 lg:grid-cols-[1.08fr_.92fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <img src={logo} alt="The House of Sports" className="mb-10 h-20 w-auto object-contain sm:h-24" />

              <div className="inline-flex items-center gap-2 rounded-full border border-[#e3262e]/30 bg-[#e3262e]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-orange-300">
                <Sparkles size={15} /> Modo mantenimiento
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.02] tracking-tight sm:text-5xl lg:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                {message}
              </p>

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                <InfoCard icon={Clock3} title="Volvemos pronto" text="Estamos afinando los últimos detalles para ti." />
                <InfoCard icon={ShieldCheck} title="Todo bajo control" text="Tus datos y pedidos permanecen seguros." />
              </div>

              <a
                href="https://www.instagram.com/thehouseofsports.pe/"
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#e3262e] px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-orange-500"
              >
                <Instagram size={18} /> Síguenos en Instagram
              </a>
            </div>

            <div className="relative hidden min-h-[620px] overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#e3262e]/20 via-zinc-900 to-black lg:block">
              <div className="absolute left-1/2 top-1/2 w-[78%] -translate-x-1/2 -translate-y-1/2">
                <div className="rounded-[2rem] border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur-md">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">The House of Sports</span>
                    <span className="h-3 w-3 animate-pulse rounded-full bg-[#e3262e] shadow-[0_0_20px_rgba(255,75,19,.85)]" />
                  </div>
                  <div className="space-y-4">
                    <div className="h-3 w-1/3 rounded-full bg-white/10" />
                    <div className="h-16 rounded-2xl border border-white/10 bg-white/[0.04]" />
                    <div className="h-16 rounded-2xl border border-white/10 bg-white/[0.04]" />
                    <div className="h-16 rounded-2xl border border-white/10 bg-white/[0.04]" />
                  </div>
                  <div className="mt-8 rounded-2xl border border-[#e3262e]/20 bg-[#e3262e]/10 p-5">
                    <p className="text-sm font-black text-orange-200">Mejorando tu experiencia</p>
                    <p className="mt-2 text-xs leading-5 text-zinc-400">Catálogo, rendimiento y experiencia de compra en optimización.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ icon: Icon, title, text }: any) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <Icon size={20} className="text-[#e3262e]" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
    </div>
  );
}
