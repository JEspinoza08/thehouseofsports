import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Package,
  RefreshCw,
  Phone,
  MapPin,
  Search,
  XCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const statuses = [
  "pendiente",
  "preparando",
  "enviado",
  "entregado",
  "cancelado",
];

const paymentLabels: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  failed: "Fallido",
  refunded: "Reembolsado",
};

const paymentStatusStyles: Record<string, string> = {
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  failed: "border-red-500/30 bg-red-500/10 text-red-400",
  refunded: "border-blue-500/30 bg-blue-500/10 text-blue-400",
};

const orderStatusStyles: Record<string, string> = {
  pendiente: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  preparando: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  enviado: "border-violet-500/30 bg-violet-500/10 text-violet-400",
  entregado: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  cancelado: "border-red-500/30 bg-red-500/10 text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [retryingInvoiceId, setRetryingInvoiceId] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const loadOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        customer_name,
        customer_dni,
        customer_phone,
        customer_address,
        customer_department,
        customer_province,
        customer_district,
        customer_reference,
        customer_zone,
        sales_channel,
        internal_notes,

        payment_method,
        payment_provider,
        payment_status,
        payment_transaction_id,
        payment_reference,
        card_brand,
        installments,
        paid_at,

        subtotal,
        shipping_cost,
        total,
        status,
        created_at,

        order_items (
          id,
          product_name,
          quantity,
          unit_price,
          subtotal,
          variant_type,
          variant_value,
          products (
            image_url
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    const orderRows = data ?? [];
    const orderIds = orderRows.map((order: any) => order.id);
    let customizationMap = new Map<string, any>();
    let documentMap = new Map<string, any>();

    if (orderIds.length > 0) {
      const [{ data: customizations }, { data: documents, error: documentsError }] = await Promise.all([
        supabase
          .from("order_item_customizations")
          .select("order_item_id,option_label,surcharge,custom_text,custom_number,flag_type,flag_value,summary")
          .in("order_id", orderIds),
        supabase
          .from("electronic_documents")
          .select("id,order_id,document_type,series,number,status,nubefact_mode,nubefact_pdf_url,nubefact_xml_url,nubefact_cdr_url,accepted_by_sunat,sunat_description,error_message,issued_at")
          .in("order_id", orderIds),
      ]);

      customizationMap = new Map((customizations || []).map((item: any) => [String(item.order_item_id), item]));
      if (!documentsError) {
        documentMap = new Map((documents || []).map((doc: any) => [String(doc.order_id), doc]));
      } else {
        console.warn("No se pudieron cargar comprobantes NubeFact:", documentsError.message);
      }
    }

    setOrders(
      orderRows.map((order: any) => ({
        ...order,
        electronic_document: documentMap.get(String(order.id)) || null,
        order_items: (order.order_items || []).map((item: any) => ({
          ...item,
          customization: customizationMap.get(String(item.id)) || null,
        })),
      })),
    );
    setLoading(false);
  };

  const retryInvoice = async (orderId: string) => {
    setRetryingInvoiceId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("emit-nubefact", {
        body: { orderId, retry: true },
      });

      if (error || !data?.ok) {
        let detail: any = data;
        try {
          detail = (await error?.context?.json()) || data;
        } catch {
          detail = data || error?.message;
        }
        alert(detail?.error || "No se pudo reintentar la emisión.");
      } else {
        await loadOrders();
      }
    } catch (error: any) {
      alert(error?.message || "No se pudo reintentar la emisión.");
    } finally {
      setRetryingInvoiceId(null);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);

    try {
      const { data, error } = await supabase.functions.invoke(
        "update-order-status",
        {
          body: {
            orderId,
            status,
          },
        },
      );

      if (error) {
        let functionError: Record<string, any> | null = null;

        try {
          functionError = await error.context?.json();
        } catch {
          functionError = null;
        }

        console.error("ERROR ACTUALIZANDO ESTADO:", functionError || error);

        alert(
          functionError?.error ||
          error.message ||
          "No se pudo actualizar el estado.",
        );

        return;
      }

      if (!data?.ok) {
        console.error("RESPUESTA INVÁLIDA:", data);

        alert(data?.error || "No se pudo actualizar el estado.");

        return;
      }

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
              ...order,
              status: data.status || status,
            }
            : order,
        ),
      );

      if (data.emailSent) {
        console.log("Estado actualizado y correo enviado:", data);
      } else if (data.warning) {
        console.warn(
          "Estado actualizado, pero correo no enviado:",
          data.warning,
        );

        alert(
          `El estado se actualizó, pero el correo no pudo enviarse: ${data.warning}`,
        );
      }
    } catch (error: any) {
      console.error("ERROR INVOCANDO update-order-status:", error);

      alert(error?.message || "Ocurrió un error actualizando el pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const normalizedOrderSearch = orderSearch
    .replace("#", "")
    .trim()
    .toLowerCase();

  const orderMetrics = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => ["pendiente", "preparando"].includes(o.status)).length,
    shipping: orders.filter((o) => o.status === "enviado").length,
    delivered: orders.filter((o) => o.status === "entregado").length,
    sales: orders.filter((o) => o.payment_status === "paid" && o.status !== "cancelado").reduce((sum, o) => sum + Number(o.total || 0), 0),
  }), [orders]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== "todos" && order.status !== statusFilter) return false;
    if (!normalizedOrderSearch) return true;
    const fullOrderId = String(order.id).toLowerCase();
    const shortOrderId = fullOrderId.slice(0, 8);
    return fullOrderId.includes(normalizedOrderSearch) || shortOrderId.includes(normalizedOrderSearch);
  });

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm font-bold text-white">Cargando pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="mb-4 text-2xl font-black text-white">Pedidos</h2>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
          <Package className="mx-auto text-gray-500" size={36} />
          <p className="mt-3 font-bold text-white">
            Todavía no hay pedidos registrados.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Pedidos", orderMetrics.total, Package],
          ["Por preparar", orderMetrics.pending, Clock3],
          ["En camino", orderMetrics.shipping, RefreshCw],
          ["Entregados", orderMetrics.delivered, CheckCircle2],
        ].map(([label, value, Icon]: any) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
            <div className="flex items-center justify-between"><p className="text-[11px] font-black uppercase tracking-[.08em] text-zinc-500">{label}</p><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-[#e3262e]"><Icon size={17}/></span></div>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-[#e3262e]/25 bg-gradient-to-br from-[#e3262e]/15 to-zinc-900 p-4 sm:col-span-2 xl:col-span-1">
          <p className="text-[11px] font-black uppercase tracking-[.08em] text-zinc-400">Ventas cobradas</p>
          <p className="mt-3 text-2xl font-black text-white">S/ {orderMetrics.sales.toFixed(2)}</p>
          <p className="mt-1 text-[10px] text-zinc-500">Pedidos pagados no cancelados</p>
        </div>
      </div>
      <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-900 p-4"><div className="flex flex-wrap gap-2">{["todos", ...statuses].map((status) => (<button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-xl px-3 py-2 text-xs font-black uppercase transition ${statusFilter === status ? "bg-[#e3262e] text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"}`}>{status === "todos" ? "Todos" : status}</button>))}</div></div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Pedidos</h2>

          <p className="mt-1 text-sm text-gray-400">
            {filteredOrders.length} de {orders.length} pedidos
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
          <div className="relative w-full sm:min-w-[320px]">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Buscar por # de orden"
              className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pl-11 pr-10 text-sm font-bold text-white outline-none transition placeholder:text-gray-600 focus:border-[#e3262e]"
            />

            {orderSearch && (
              <button
                type="button"
                onClick={() => setOrderSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            Actualizar
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center">
          <Search className="mx-auto text-gray-500" size={36} />

          <p className="mt-3 font-bold text-white">
            No encontramos ese pedido.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {filteredOrders.map((order) => {
          const paymentStatus = order.payment_status || "pending";
          const installments = Number(order.installments || 1);

          return (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-[0_18px_60px_rgba(0,0,0,.18)] transition hover:border-white/20"
            >
              <div className="border-b border-white/10 bg-gradient-to-r from-white/[.035] to-transparent p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-black text-white">
                        Pedido #{order.id.slice(0, 8).toUpperCase()}
                      </p>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${paymentStatusStyles[paymentStatus] ||
                          paymentStatusStyles.pending
                          }`}
                      >
                        {paymentLabels[paymentStatus] || paymentStatus}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${orderStatusStyles[order.status] ||
                          orderStatusStyles.pendiente
                          }`}
                      >
                        {order.status}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black uppercase text-zinc-300">
                        {order.sales_channel === "store" ? "Tienda física" : "Online"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleString("es-PE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  <div className="w-full lg:w-auto">
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500">
                      Estado del pedido
                    </label>

                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => updateStatus(order.id, e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-zinc-800 px-4 py-3 text-sm font-bold text-white outline-none disabled:cursor-wait disabled:opacity-50 lg:min-w-[190px]"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="text-sm font-black uppercase text-white">
                    Datos del cliente
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <p className="font-bold text-white">
                      {order.customer_name}
                    </p>
                    {order.customer_dni && (
                      <p className="text-gray-300">
                        DNI:{" "}
                        <span className="font-bold text-white">
                          {order.customer_dni}
                        </span>
                      </p>
                    )}

                    <div className="flex items-start gap-2 text-gray-300">
                      <Phone className="mt-0.5 shrink-0" size={16} />
                      <span>{order.customer_phone}</span>
                    </div>

                    <div className="flex items-start gap-2 text-gray-300">
                      <MapPin className="mt-0.5 shrink-0" size={16} />
                      <span>
                        {order.customer_address}
                        {order.customer_district
                          ? `, ${order.customer_district}`
                          : ""}
                        {order.customer_province
                          ? `, ${order.customer_province}`
                          : ""}
                        {order.customer_department
                          ? `, ${order.customer_department}`
                          : ""}
                      </span>
                    </div>

                    {order.customer_zone && (
                      <p className="text-gray-300">
                        Zona:{" "}
                        <span className="font-bold text-white">
                          {order.customer_zone}
                        </span>
                      </p>
                    )}

                    {order.customer_reference && (
                      <p className="text-gray-300">
                        Referencia:{" "}
                        <span className="text-white">
                          {order.customer_reference}
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-white">
                      Información del pago
                    </h3>

                    {paymentStatus === "paid" ? (
                      <CheckCircle2 className="text-emerald-400" size={21} />
                    ) : paymentStatus === "failed" ? (
                      <XCircle className="text-red-400" size={21} />
                    ) : (
                      <Clock3 className="text-amber-400" size={21} />
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <PaymentField
                      label="Método"
                      value={formatPaymentMethod(order.payment_method)}
                    />

                    <PaymentField
                      label="Proveedor"
                      value={order.payment_provider?.toUpperCase() || "—"}
                    />

                    <PaymentField
                      label="Tarjeta"
                      value={order.card_brand || "—"}
                    />

                    <PaymentField
                      label="Cuotas"
                      value={
                        installments > 1
                          ? `${installments} cuotas`
                          : "Sin cuotas"
                      }
                    />

                    <PaymentField
                      label="Referencia"
                      value={order.payment_reference || "—"}
                    />

                    <PaymentField
                      label="Fecha de pago"
                      value={
                        order.paid_at
                          ? new Date(order.paid_at).toLocaleString("es-PE", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                          : "—"
                      }
                    />
                  </div>

                  {order.payment_transaction_id && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-zinc-950 p-3">
                      <p className="text-xs font-bold uppercase text-gray-500">
                        ID de transacción
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-3">
                        <code className="break-all text-xs text-gray-300">
                          {order.payment_transaction_id}
                        </code>

                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              order.payment_transaction_id,
                            )
                          }
                          className="shrink-0 rounded-lg border border-white/10 p-2 text-gray-400 transition hover:text-white"
                          title="Copiar ID"
                        >
                          <ExternalLink size={15} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileText size={20} className="text-[#e3262e]" />
                      <div>
                        <h3 className="text-sm font-black uppercase text-white">Comprobante electrónico</h3>
                        <p className="mt-1 text-xs text-gray-500">NubeFact · {order.electronic_document?.nubefact_mode?.toUpperCase() || "sin emitir"}</p>
                      </div>
                    </div>

                    {order.electronic_document && (
                      <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase ${
                        order.electronic_document.status === "issued"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : order.electronic_document.status === "pending"
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}>
                        {order.electronic_document.status}
                      </span>
                    )}
                  </div>

                  {order.electronic_document ? (
                    <div className="mt-4">
                      <p className="text-sm font-black text-white">
                        {order.electronic_document.document_type === "factura" ? "Factura" : "Boleta"} {order.electronic_document.series}-{String(order.electronic_document.number).padStart(8, "0")}
                      </p>
                      {order.electronic_document.sunat_description && (
                        <p className="mt-2 text-xs leading-5 text-gray-400">{order.electronic_document.sunat_description}</p>
                      )}
                      {order.electronic_document.error_message && (
                        <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-300">
                          {order.electronic_document.error_message}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.electronic_document.nubefact_pdf_url && (
                          <a href={order.electronic_document.nubefact_pdf_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">Ver PDF</a>
                        )}
                        {order.electronic_document.nubefact_xml_url && (
                          <a href={order.electronic_document.nubefact_xml_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">XML</a>
                        )}
                        {order.electronic_document.nubefact_cdr_url && (
                          <a href={order.electronic_document.nubefact_cdr_url} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/10">CDR</a>
                        )}
                        {order.electronic_document.status !== "issued" && order.payment_status === "paid" && (
                          <button type="button" onClick={() => retryInvoice(order.id)} disabled={retryingInvoiceId === order.id} className="inline-flex items-center gap-2 rounded-lg bg-[#e3262e] px-3 py-2 text-xs font-black text-white disabled:opacity-50">
                            <RefreshCw size={14} className={retryingInvoiceId === order.id ? "animate-spin" : ""} />
                            {retryingInvoiceId === order.id ? "Reintentando" : "Reintentar emisión"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-gray-400">Este pedido todavía no tiene comprobante electrónico registrado.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-white/10 p-5">
                <h3 className="mb-4 text-sm font-black uppercase text-white">
                  Productos
                </h3>

                <div className="space-y-3">
                  {order.order_items?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={
                            item.products?.image_url ||
                            "/placeholder-product.png"
                          }
                          alt={item.product_name}
                          className="h-14 w-14 shrink-0 rounded-lg bg-white object-contain"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {item.product_name}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Cantidad: {item.quantity}
                            {item.variant_value
                              ? ` · ${item.variant_type === "shoe_size" ? "Número" : "Talla"}: ${item.variant_value}`
                              : ""}
                          </p>
                          {item.customization && (
                            <p className="mt-1 text-xs font-semibold text-fuchsia-300">
                              Personalización: {item.customization.summary || item.customization.option_label}
                            </p>
                          )}

                          {item.unit_price != null && (
                            <p className="mt-1 text-xs text-gray-500">
                              S/{" "}
                              {Number(item.unit_price).toLocaleString("es-PE")}{" "}
                              c/u
                            </p>
                          )}
                        </div>
                      </div>

                      <strong className="shrink-0 text-sm text-white">
                        S/ {Number(item.subtotal).toLocaleString("es-PE")}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/10 bg-black/20 p-5">
                <div className="ml-auto max-w-sm space-y-3">
                  <TotalRow
                    label="Subtotal"
                    value={Number(order.subtotal || 0)}
                  />

                  <TotalRow
                    label="Envío"
                    value={Number(order.shipping_cost || 0)}
                  />

                  <div className="flex justify-between border-t border-white/10 pt-4">
                    <span className="font-black text-white">Total</span>

                    <strong className="text-xl text-white">
                      S/ {Number(order.total || 0).toLocaleString("es-PE")}
                    </strong>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PaymentField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className="mt-1 font-bold text-white">{value}</p>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-300">{label}</span>

      <strong className="text-white">S/ {value.toLocaleString("es-PE")}</strong>
    </div>
  );
}

function formatPaymentMethod(method?: string) {
  const methods: Record<string, string> = {
    tarjeta: "Tarjeta",
    transferencia: "Transferencia",
    yape_plin: "Yape / Plin",
  };

  return methods[method || ""] || method || "—";
}
