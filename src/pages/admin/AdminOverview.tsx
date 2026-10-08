import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  Boxes,
  CalendarDays,
  LogOut,
  MapPinned,
  PackageCheck,
  ShoppingBag,
  Store,
  TrendingUp,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import AdminNav from "../../components/AdminNav";

const money = (value: number) =>
  `S/ ${Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function AdminOverview() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: ordersData }, { data: productData }] = await Promise.all([
        supabase
          .from("orders")
          .select("id,total,status,payment_status,customer_zone,customer_department,customer_province,created_at,sales_channel")
          .order("created_at", { ascending: false }),
        supabase.from("products").select("id,stock,is_active"),
      ]);
      setOrders(ordersData ?? []);
      setProducts(productData ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.payment_status === "paid" && o.status !== "cancelado");
    const todayKey = new Date().toLocaleDateString("en-CA");
    const month = new Date().getMonth();
    const year = new Date().getFullYear();
    const today = paid.filter((o) => new Date(o.created_at).toLocaleDateString("en-CA") === todayKey);
    const thisMonth = paid.filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    });
    const lima = paid.filter((o) => (o.customer_zone || "").toLowerCase() === "lima");
    const provinces = paid.filter((o) => (o.customer_zone || "").toLowerCase() !== "lima");
    const online = paid.filter((o) => (o.sales_channel || "online") === "online");
    const store = paid.filter((o) => o.sales_channel === "store");
    const revenue = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const monthRevenue = thisMonth.reduce((s, o) => s + Number(o.total || 0), 0);
    const todayRevenue = today.reduce((s, o) => s + Number(o.total || 0), 0);
    return { paid, lima, provinces, online, store, revenue, monthRevenue, todayRevenue };
  }, [orders]);

  const regionRows = useMemo(() => {
    const grouped = new Map<string, { count: number; total: number }>();
    stats.paid.forEach((o) => {
      const key = o.customer_zone === "Lima" ? "Lima" : o.customer_province || o.customer_department || "Provincia";
      const current = grouped.get(key) || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(o.total || 0);
      grouped.set(key, current);
    });
    return [...grouped.entries()]
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [stats.paid]);

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStock = products.filter((p) => Number(p.stock || 0) <= 3).length;

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
            <h1 className="mt-2 text-3xl font-black md:text-4xl">Dashboard integral</h1>
            <p className="mt-2 text-sm text-zinc-400">Ventas, pedidos, caja, zonas y stock en una sola vista.</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black hover:bg-white/10">
            <LogOut size={18} /> Salir
          </button>
        </header>

        <AdminNav />

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-10 text-center text-zinc-400">Cargando indicadores...</div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={Banknote} label="Caja acumulada" value={money(stats.revenue)} hint={`${stats.paid.length} ventas pagadas`} />
              <Stat icon={CalendarDays} label="Ingresos del mes" value={money(stats.monthRevenue)} hint={`Hoy: ${money(stats.todayRevenue)}`} />
              <Stat icon={MapPinned} label="Pedidos Lima" value={String(stats.lima.length)} hint={money(stats.lima.reduce((s, o) => s + Number(o.total || 0), 0))} />
              <Stat icon={PackageCheck} label="Pedidos provincias" value={String(stats.provinces.length)} hint={money(stats.provinces.reduce((s, o) => s + Number(o.total || 0), 0))} />
            </section>

            <section className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={ShoppingBag} label="Ventas online" value={String(stats.online.length)} hint={money(stats.online.reduce((s, o) => s + Number(o.total || 0), 0))} />
              <Stat icon={Store} label="Ventas presenciales" value={String(stats.store.length)} hint={money(stats.store.reduce((s, o) => s + Number(o.total || 0), 0))} />
              <Stat icon={Boxes} label="Stock total" value={String(totalStock)} hint={`${products.length} productos`} />
              <Stat icon={TrendingUp} label="Stock bajo" value={String(lowStock)} hint="3 unidades o menos" danger={lowStock > 0} />
            </section>

            <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                <h2 className="text-lg font-black">Ventas por zona</h2>
                <p className="mt-1 text-xs text-zinc-500">Ranking por facturación registrada en el sistema.</p>
                <div className="mt-5 space-y-4">
                  {regionRows.length === 0 ? <p className="text-sm text-zinc-500">Aún no hay ventas pagadas.</p> : regionRows.map((row) => {
                    const max = Math.max(...regionRows.map((r) => r.total), 1);
                    return (
                      <div key={row.name}>
                        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="font-bold">{row.name}</span>
                          <span className="text-zinc-400">{row.count} ventas · {money(row.total)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-[#e3262e]" style={{ width: `${Math.max(5, (row.total / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
                <h2 className="text-lg font-black">Accesos rápidos</h2>
                <div className="mt-4 grid gap-3">
                  <QuickButton onClick={() => navigate("/admin/manual-sales")} icon={Store} title="Registrar venta presencial" text="Descuenta stock y queda pagada/entregada." />
                  <QuickButton onClick={() => navigate("/admin/orders")} icon={PackageCheck} title="Revisar pedidos" text="Consulta clientes, zonas, pagos y estados." />
                  <QuickButton onClick={() => navigate("/admin/blog")} icon={ShoppingBag} title="Publicar noticia" text="Alimenta el blog de THS desde el panel." />
                  <QuickButton onClick={() => navigate("/admin/products")} icon={Boxes} title="Gestionar inventario" text="Productos, variantes y disponibilidad." />
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value, hint, danger = false }: any) {
  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">{label}</p><Icon size={18} className="text-[#e3262e]" /></div>
      <p className={`mt-3 text-2xl font-black ${danger ? "text-red-400" : "text-white"}`}>{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </article>
  );
}

function QuickButton({ onClick, icon: Icon, title, text }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#e3262e]/50 hover:bg-white/[0.06]">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e3262e]/10 text-[#e3262e]"><Icon size={18} /></span>
      <span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs text-zinc-500">{text}</span></span>
    </button>
  );
}
