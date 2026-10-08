import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, LogOut, Save, Settings2, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../components/AdminNav";
import { supabase } from "../../lib/supabase";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [title, setTitle] = useState("Estamos preparando algo mejor");
  const [message, setMessage] = useState("Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("maintenance_enabled,maintenance_title,maintenance_message")
        .eq("id", 1)
        .single();

      if (error) setError(error.message);
      if (data) {
        setMaintenanceEnabled(Boolean(data.maintenance_enabled));
        setTitle(data.maintenance_title || "Estamos preparando algo mejor");
        setMessage(data.maintenance_message || "Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.");
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError("");

    const { error } = await supabase
      .from("site_settings")
      .upsert(
        {
          id: 1,
          maintenance_enabled: maintenanceEnabled,
          maintenance_title: title.trim() || "Estamos preparando algo mejor",
          maintenance_message: message.trim() || "Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

    if (error) setError(error.message);
    else {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white xl:pl-[15.5rem]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e3262e]">The House of Sports</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Configuración de la tienda</h1>
            <p className="mt-2 text-sm text-zinc-400">Controla el estado público de la web sin tocar código.</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10">
            <LogOut size={18} /> Salir
          </button>
        </header>

        <AdminNav />

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-10 text-center text-zinc-400">
            <Loader2 className="mx-auto mb-3 animate-spin" /> Cargando configuración...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_.72fr]">
            <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5 sm:p-7">
              <div className="flex items-start gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e3262e]/10 text-[#e3262e]"><Settings2 size={21} /></span>
                <div>
                  <h2 className="text-xl font-black">Modo mantenimiento</h2>
                  <p className="mt-1 text-sm leading-6 text-zinc-400">Al activarlo, todos los visitantes verán la pantalla de mantenimiento. El panel `/admin` seguirá funcionando normalmente.</p>
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-black">¿La web se encuentra en mantenimiento?</p>
                    <p className={`mt-1 text-xs font-bold ${maintenanceEnabled ? "text-orange-300" : "text-emerald-400"}`}>
                      {maintenanceEnabled ? "Sí · La tienda pública está bloqueada" : "No · La tienda está visible para clientes"}
                    </p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={maintenanceEnabled}
                    onClick={() => setMaintenanceEnabled((value) => !value)}
                    className={`relative h-8 w-14 shrink-0 rounded-full transition ${maintenanceEnabled ? "bg-[#e3262e]" : "bg-zinc-700"}`}
                  >
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${maintenanceEnabled ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-5">
                <label>
                  <span className="mb-2 block text-sm font-black">Título de mantenimiento</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={90}
                    className="w-full rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none transition focus:border-[#e3262e]"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-sm font-black">Mensaje para tus clientes</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={280}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#e3262e]"
                  />
                  <span className="mt-1 block text-right text-[11px] text-zinc-600">{message.length}/280</span>
                </label>
              </div>

              {error && <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

              <button
                onClick={save}
                disabled={saving}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#e3262e] px-5 py-3 text-sm font-black transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
                {saving ? "Guardando..." : saved ? "Configuración guardada" : "Guardar cambios"}
              </button>
            </section>

            <aside className={`rounded-2xl border p-6 ${maintenanceEnabled ? "border-[#e3262e]/30 bg-[#e3262e]/10" : "border-emerald-500/20 bg-emerald-500/[0.06]"}`}>
              <Wrench size={30} className={maintenanceEnabled ? "text-[#e3262e]" : "text-emerald-400"} />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Estado actual</p>
              <h3 className="mt-2 text-2xl font-black">{maintenanceEnabled ? "Mantenimiento activado" : "Tienda operativa"}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {maintenanceEnabled
                  ? "Cuando guardes, los clientes que entren o recarguen la web verán la pantalla de mantenimiento."
                  : "La web pública se mostrará con normalidad a todos los visitantes."}
              </p>
              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-zinc-500">
                Consejo: activa el modo antes de despliegues importantes, cambios de catálogo o mantenimientos de pago.
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
