import { useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminOrders from "./AdminOrders";
import AdminNav from "../../components/AdminNav";

export default function AdminOrdersPage() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white xl:pl-[15.5rem]">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 transition hover:text-white"
            >
              <ArrowLeft size={18} />
              Volver al resumen
            </button>

            <p className="text-sm font-bold uppercase tracking-wider text-[#e3262e]">
              The House of Sports
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Gestión de pedidos
            </h1>

            <p className="mt-3 text-gray-400">
              Revisa pedidos y actualiza sus estados.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10"
          >
            <LogOut size={18} />
            Salir
          </button>
        </header>

        <AdminNav />
        <AdminOrders />
      </div>
    </main>
  );
}