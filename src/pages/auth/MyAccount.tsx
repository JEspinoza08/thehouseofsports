import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  FileText,
  Package,
  PackageCheck,
  Palette,
  Ruler,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

const BRAND = "#e3262e";

const orderSteps = [
  { key: "pendiente", label: "Pendiente", description: "Pedido recibido", icon: Clock3 },
  { key: "preparando", label: "Preparando", description: "Estamos preparando tu compra", icon: PackageCheck },
  { key: "enviado", label: "Enviado", description: "Tu pedido está en camino", icon: Truck },
  { key: "entregado", label: "Entregado", description: "Pedido entregado", icon: Check },
];

const statusPosition: Record<string, number> = {
  pendiente: 0,
  preparando: 1,
  enviado: 2,
  entregado: 3,
};

const formatMoney = (value: number | string | null | undefined) =>
  `S/ ${Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getStatusClasses = (status: string) => {
  if (status === "cancelado") return "bg-red-100 text-red-700";
  if (status === "entregado") return "bg-green-100 text-green-700";
  if (status === "enviado") return "bg-violet-100 text-violet-700";
  if (status === "preparando") return "bg-blue-100 text-blue-700";
  return "bg-amber-100 text-amber-800";
};

const paymentLabel = (order: any) => {
  const method = String(order.payment_method || "").toLowerCase();
  if (order.sales_channel === "store") return "Pago en tienda";
  if (method.includes("culqi") || order.payment_provider === "culqi") return "Pago con tarjeta";
  if (method) return order.payment_method;
  return "Pago web";
};

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelado") {
    return (
      <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3 text-red-700">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <XCircle size={21} />
          </div>
          <div>
            <p className="text-sm font-black">Pedido cancelado</p>
            <p className="mt-1 text-xs leading-5 text-red-600">
              Este pedido fue cancelado. Si necesitas ayuda, comunícate con The House of Sports.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentStep = statusPosition[status] ?? 0;

  return (
    <div className="mt-5">
      <div className="space-y-0 sm:hidden">
        {orderSteps.map((step, index) => {
          const Icon = step.icon;
          const completed = index < currentStep;
          const active = index === currentStep;
          const reached = index <= currentStep;
          const isLast = index === orderSteps.length - 1;

          return (
            <div key={step.key} className="relative flex gap-4">
              <div className="relative flex flex-col items-center">
                <div
                  className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${
                    reached ? "border-[#e3262e] text-[#e3262e]" : "border-neutral-200 text-neutral-400"
                  }`}
                >
                  {completed ? <Check size={17} /> : <Icon size={17} />}
                </div>
                {!isLast && (
                  <div className={`h-14 w-1 ${index < currentStep ? "bg-[#e3262e]" : "bg-neutral-200"}`} />
                )}
              </div>

              <div className="min-w-0 pb-5 pt-1">
                <p className={`text-xs font-black uppercase ${reached ? "text-neutral-950" : "text-neutral-400"}`}>
                  {step.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">{step.description}</p>
                {active && (
                  <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase text-[#e3262e]">
                    Estado actual
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative hidden sm:block">
        <div className="absolute left-[7%] right-[7%] top-5 h-1 rounded-full bg-neutral-200" />
        <div
          className="absolute left-[7%] top-5 h-1 rounded-full bg-[#e3262e] transition-all duration-500"
          style={{ width: `${(currentStep / (orderSteps.length - 1)) * 86}%` }}
        />

        <div className="relative grid grid-cols-4">
          {orderSteps.map((step, index) => {
            const Icon = step.icon;
            const completed = index < currentStep;
            const active = index === currentStep;
            const reached = index <= currentStep;

            return (
              <div key={step.key} className="min-w-0 px-2 text-center">
                <div
                  className={`relative mx-auto flex h-11 w-11 items-center justify-center rounded-full border-4 bg-white transition ${
                    reached ? "border-[#e3262e] text-[#e3262e]" : "border-neutral-200 text-neutral-400"
                  }`}
                >
                  {completed ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <p className={`mt-3 text-xs font-black uppercase ${active || completed ? "text-neutral-950" : "text-neutral-400"}`}>
                  {step.label}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-neutral-500">{step.description}</p>
                {active && (
                  <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-1 text-[10px] font-black uppercase text-[#e3262e]">
                    Estado actual
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MyAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [email, setEmail] = useState<string | undefined>("");
  const [fullName, setFullName] = useState<string | null>("");
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const getTodayLocal = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const today = getTodayLocal();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          setIsLogged(false);
          setLoading(false);
          return;
        }

        setIsLogged(true);
        setEmail(data.user.email);

        const [{ data: profile }, { data: ordersData, error: ordersError }] = await Promise.all([
          supabase.from("profiles").select("full_name").eq("id", data.user.id).single(),
          supabase
            .from("orders")
            .select(
              `
                id,
                total,
                status,
                payment_method,
                payment_provider,
                payment_status,
                created_at,
                sales_channel,
                order_items (
                  id,
                  product_name,
                  quantity,
                  unit_price,
                  subtotal,
                  variant_id,
                  variant_type,
                  variant_value,
                  products (
                    image_url
                  )
                )
              `,
            )
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false }),
        ]);

        if (ordersError) throw ordersError;

        const orderRows = ordersData ?? [];
        const orderIds = orderRows.map((order: any) => order.id);
        const variantIds = orderRows
          .flatMap((order: any) => order.order_items || [])
          .map((item: any) => item.variant_id)
          .filter(Boolean);

        const customizationMap = new Map<string, any>();
        const variantMap = new Map<string, any>();
        const documentMap = new Map<string, any>();

        if (orderIds.length > 0) {
          const [{ data: customizations }, { data: documents, error: documentsError }] = await Promise.all([
            supabase
              .from("order_item_customizations")
              .select(
                "order_item_id,summary,option_label,surcharge,custom_text,custom_number,flag_type,flag_value",
              )
              .in("order_id", orderIds),
            supabase
              .from("electronic_documents")
              .select("order_id,document_type,series,number,status,nubefact_pdf_url,nubefact_xml_url,nubefact_cdr_url,issued_at")
              .in("order_id", orderIds),
          ]);

          (customizations || []).forEach((item: any) => {
            customizationMap.set(String(item.order_item_id), item);
          });
          if (!documentsError) {
            (documents || []).forEach((doc: any) => {
              documentMap.set(String(doc.order_id), doc);
            });
          }
        }

        if (variantIds.length > 0) {
          const uniqueVariantIds = [...new Set(variantIds.map(String))];
          const { data: variants } = await supabase
            .from("product_variants")
            .select("id,color_name,color_hex")
            .in("id", uniqueVariantIds);

          (variants || []).forEach((variant: any) => {
            variantMap.set(String(variant.id), variant);
          });
        }

        const hydratedOrders = orderRows.map((order: any) => ({
          ...order,
          electronic_document: documentMap.get(String(order.id)) || null,
          order_items: (order.order_items || []).map((item: any) => ({
            ...item,
            customization: customizationMap.get(String(item.id)) || null,
            variant_meta: item.variant_id ? variantMap.get(String(item.variant_id)) || null : null,
          })),
        }));

        setOrders(hydratedOrders);
        setExpandedOrderId(hydratedOrders[0]?.id ?? null);
        setFullName(profile?.full_name ?? null);
      } catch (error) {
        console.error("Error cargando Mi cuenta:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      if (dateFrom && orderDate < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && orderDate > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo]);

  const metrics = useMemo(() => {
    const delivered = orders.filter((order) => order.status === "entregado").length;
    const active = orders.filter((order) => ["pendiente", "preparando", "enviado"].includes(order.status)).length;
    const spent = orders
      .filter((order) => order.status !== "cancelado")
      .reduce((sum, order) => sum + Number(order.total || 0), 0);
    return { delivered, active, spent };
  }, [orders]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-neutral-200 border-t-[#e3262e]" />
          <p className="mt-4 text-sm font-semibold text-neutral-500">Cargando tu cuenta...</p>
        </div>
      </main>
    );
  }

  if (!isLogged) return <Navigate to="/login" replace />;

  return (
    <main className="min-h-screen bg-neutral-50 px-3 pb-10 pt-5 sm:px-6 sm:pb-16 sm:pt-12">
      <section className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-2 text-xs font-semibold text-neutral-600 transition hover:text-[#e3262e] sm:mb-6 sm:text-sm"
        >
          <ArrowLeft size={18} />
          Volver a la tienda
        </button>

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm sm:rounded-3xl">
          <div className="relative overflow-hidden bg-neutral-950 px-4 py-5 text-white sm:px-8 sm:py-8">
            <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#e3262e]/20 blur-3xl" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">Mi cuenta THS</p>
                <h1 className="mt-1 text-[23px] font-black leading-tight sm:mt-2 sm:text-4xl">
                  Hola, {fullName || "cliente"} 👋
                </h1>
                {email && <p className="mt-1 text-sm text-white/60">{email}</p>}
              </div>

              <button
                type="button"
                onClick={logout}
                className="w-full rounded-xl bg-white px-4 py-2 text-sm font-black text-neutral-950 transition hover:bg-neutral-100 sm:w-auto sm:px-5 sm:py-2.5"
              >
                Cerrar sesión
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 sm:gap-3 sm:p-6">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 sm:rounded-2xl sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase leading-tight tracking-wide text-neutral-500 sm:text-xs">Pedidos</p>
                  <p className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">{orders.length}</p>
                </div>
                <div className="hidden h-11 w-11 place-items-center rounded-xl bg-white text-[#e3262e] shadow-sm sm:grid">
                  <ShoppingBag size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 sm:rounded-2xl sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase leading-tight tracking-wide text-neutral-500 sm:text-xs">En proceso</p>
                  <p className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">{metrics.active}</p>
                </div>
                <div className="hidden h-11 w-11 place-items-center rounded-xl bg-white text-[#e3262e] shadow-sm sm:grid">
                  <Truck size={21} />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5 sm:rounded-2xl sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase leading-tight tracking-wide text-neutral-500 sm:text-xs">Entregados</p>
                  <p className="mt-1 text-xl font-black text-neutral-950 sm:text-2xl">{metrics.delivered}</p>
                </div>
                <div className="hidden h-11 w-11 place-items-center rounded-xl bg-white text-[#e3262e] shadow-sm sm:grid">
                  <PackageCheck size={21} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-black text-neutral-950">Mis pedidos</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {filteredOrders.length} de {orders.length} pedidos
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-bold text-neutral-700 transition hover:border-[#e3262e] hover:text-[#e3262e] sm:hidden"
            >
              <SlidersHorizontal size={16} />
              Filtrar
              <ChevronDown size={16} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div
            className={`overflow-hidden transition-all duration-300 ${
              showFilters ? "mt-4 max-h-[400px] opacity-100" : "max-h-0 opacity-0 sm:mt-4 sm:max-h-[400px] sm:opacity-100"
            }`}
          >
            <div className="grid gap-3 rounded-2xl bg-neutral-50 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase text-neutral-500">Desde</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  max={dateTo || undefined}
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#e3262e]"
                />
              </label>

              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-bold uppercase text-neutral-500">Hasta</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  min={dateFrom || undefined}
                  className="block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#e3262e]"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setDateFrom(today);
                  setDateTo(today);
                }}
                className="self-end rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-[#e3262e] hover:text-[#e3262e]"
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => {
                  setDateFrom("");
                  setDateTo("");
                }}
                disabled={!dateFrom && !dateTo}
                className="self-end rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:border-[#e3262e] hover:text-[#e3262e] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Limpiar
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
              <Package className="mx-auto text-neutral-300" size={38} />
              <p className="mt-4 font-semibold">Cuando realices tu primera compra aparecerá aquí.</p>
              <button
                onClick={() => navigate("/")}
                className="mt-5 rounded-xl bg-[#e3262e] px-6 py-3 font-bold text-white transition hover:bg-[#d94027]"
              >
                Explorar productos
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-10 text-center">
              <CalendarDays className="mx-auto text-neutral-300" size={38} />
              <p className="mt-4 font-semibold">No encontramos pedidos dentro de las fechas seleccionadas.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3 sm:mt-6 sm:space-y-4">
              {filteredOrders.map((order) => {
                const expanded = expandedOrderId === order.id;

                return (
                  <article key={order.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setExpandedOrderId(expanded ? null : order.id)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-neutral-50 sm:p-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-neutral-950">Pedido #{order.id.slice(0, 8)}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${getStatusClasses(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                          <span>{new Date(order.created_at).toLocaleDateString("es-PE")}</span>
                          <span>•</span>
                          <span>{order.sales_channel === "store" ? "Compra en tienda" : "Compra web"}</span>
                          <span>•</span>
                          <strong className="text-neutral-900">{formatMoney(order.total)}</strong>
                        </div>
                      </div>

                      <ChevronDown
                        size={20}
                        className={`shrink-0 text-neutral-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expanded && (
                      <div className="border-t border-neutral-100 p-4 sm:p-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="rounded-xl bg-neutral-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-500">
                              <CalendarDays size={15} /> Fecha
                            </div>
                            <p className="mt-2 text-sm font-bold text-neutral-950">
                              {new Date(order.created_at).toLocaleString("es-PE", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>

                          <div className="rounded-xl bg-neutral-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-500">
                              <CreditCard size={15} /> Pago
                            </div>
                            <p className="mt-2 text-sm font-bold text-neutral-950">{paymentLabel(order)}</p>
                          </div>

                          <div className="rounded-xl bg-neutral-50 p-3">
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-500">
                              <ShoppingBag size={15} /> Canal
                            </div>
                            <p className="mt-2 text-sm font-bold text-neutral-950">
                              {order.sales_channel === "store" ? "Tienda física" : "Tienda online"}
                            </p>
                          </div>
                        </div>

                        <OrderTimeline status={order.status} />

                        <div className="mt-6 space-y-3">
                          {order.order_items?.map((item: any) => {
                            const colorName = item.variant_meta?.color_name;
                            const colorHex = item.variant_meta?.color_hex;
                            const variantLabel = item.variant_type === "shoe_size" ? "Número" : "Talla";

                            return (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:p-4"
                              >
                                <div className="flex gap-3 sm:gap-4">
                                  <img
                                    src={item.products?.image_url || "/placeholder.svg"}
                                    alt={item.product_name}
                                    className="h-20 w-20 shrink-0 rounded-xl border border-neutral-200 bg-white object-contain sm:h-24 sm:w-24"
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="font-black text-neutral-950">{item.product_name}</p>
                                        <p className="mt-1 text-xs text-neutral-500">Cantidad: {item.quantity}</p>
                                      </div>
                                      <strong className="whitespace-nowrap text-sm text-neutral-950">
                                        {formatMoney(item.subtotal)}
                                      </strong>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {item.variant_value && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-700">
                                          <Ruler size={13} /> {variantLabel}: {item.variant_value}
                                        </span>
                                      )}

                                      {colorName && (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-bold text-neutral-700">
                                          <span
                                            className="h-3.5 w-3.5 rounded-full border border-black/10"
                                            style={{ backgroundColor: colorHex || undefined }}
                                          />
                                          <Palette size={13} /> {colorName}
                                        </span>
                                      )}
                                    </div>

                                    {item.customization && (
                                      <div className="mt-3 rounded-xl border border-fuchsia-200 bg-fuchsia-50 p-3">
                                        <div className="flex items-start gap-2">
                                          <Sparkles className="mt-0.5 shrink-0 text-fuchsia-600" size={16} />
                                          <div className="min-w-0">
                                            <p className="text-xs font-black uppercase tracking-wide text-fuchsia-700">
                                              Personalización
                                            </p>
                                            <p className="mt-1 text-xs font-semibold leading-5 text-fuchsia-800">
                                              {item.customization.summary || item.customization.option_label}
                                            </p>
                                            {Number(item.customization.surcharge || 0) > 0 && (
                                              <p className="mt-1 text-[11px] text-fuchsia-700">
                                                Adicional: +{formatMoney(item.customization.surcharge)}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {order.electronic_document && (
                          <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <FileText size={18} className="text-[#e3262e]" />
                                <div>
                                  <p className="text-xs font-black uppercase text-neutral-500">Comprobante electrónico</p>
                                  <p className="mt-1 text-sm font-black text-neutral-950">
                                    {order.electronic_document.document_type === "factura" ? "Factura" : "Boleta"} {order.electronic_document.series}-{String(order.electronic_document.number).padStart(8, "0")}
                                  </p>
                                </div>
                              </div>
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${order.electronic_document.status === "issued" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800"}`}>
                                {order.electronic_document.status === "issued" ? "Emitido" : "Pendiente"}
                              </span>
                            </div>

                            {order.electronic_document.status === "issued" && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {order.electronic_document.nubefact_pdf_url && (
                                  <a href={order.electronic_document.nubefact_pdf_url} target="_blank" rel="noreferrer" className="rounded-lg bg-neutral-950 px-3 py-2 text-xs font-black text-white">Ver PDF</a>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
                          <span className="font-black text-neutral-700">Total del pedido</span>
                          <strong className="text-lg font-black text-neutral-950">{formatMoney(order.total)}</strong>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}