import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MaintenancePage from "../pages/MaintenancePage";

type MaintenanceState = {
  enabled: boolean;
  title: string;
  message: string;
};

const fallback: MaintenanceState = {
  enabled: false,
  title: "Estamos preparando algo mejor",
  message: "Nuestra tienda se encuentra temporalmente en mantenimiento. Volveremos muy pronto.",
};

export default function SiteMaintenanceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<MaintenanceState>(fallback);
  const [loading, setLoading] = useState(true);

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadMaintenance = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("maintenance_enabled,maintenance_title,maintenance_message")
        .eq("id", 1)
        .maybeSingle();

      if (!mounted) return;

      // Fail-open: si Supabase no responde, la tienda sigue disponible.
      if (!error && data) {
        setState({
          enabled: Boolean(data.maintenance_enabled),
          title: data.maintenance_title || fallback.title,
          message: data.maintenance_message || fallback.message,
        });
      }
      setLoading(false);
    };

    loadMaintenance();

    return () => {
      mounted = false;
    };
  }, [isAdminRoute, location.pathname]);

  if (isAdminRoute) return <>{children}</>;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/15 border-t-[#e3262e]" />
          <p className="text-sm font-semibold text-zinc-400">Cargando The House of Sports...</p>
        </div>
      </main>
    );
  }

  if (state.enabled) {
    return <MaintenancePage title={state.title} message={state.message} />;
  }

  return <>{children}</>;
}
