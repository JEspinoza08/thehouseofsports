import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const money = (value: unknown) =>
  `S/ ${Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const shortOrder = (id: string) => String(id || "").replaceAll("-", "").slice(0, 8).toUpperCase();

async function sendResendEmail(args: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      ...(args.replyTo ? { reply_to: args.replyTo } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Resend respondió ${response.status}`);
  }
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
    const replyTo = Deno.env.get("RESEND_REPLY_TO") || "admi.ths.pe@gmail.com";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ ok: false, error: "Faltan secretos de Supabase" }, 500);
    }
    if (!resendApiKey || !fromEmail) {
      return json(
        {
          ok: false,
          error: "Configura RESEND_API_KEY y RESEND_FROM_EMAIL en los secretos de Supabase",
        },
        500,
      );
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ ok: false, error: "No autenticado" }, 401);
    }

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) {
      return json({ ok: false, error: "Sesión inválida" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    if (!orderId) return json({ ok: false, error: "Falta orderId" }, 400);

    const { data: profile } = await service
      .from("profiles")
      .select("role,is_active,email,full_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.is_active === false) {
      return json({ ok: false, error: "Cuenta inactiva" }, 403);
    }

    const { data: order, error: orderError } = await service
      .from("orders")
      .select(`
        id,user_id,customer_name,customer_phone,customer_address,
        customer_department,customer_province,customer_district,customer_reference,
        payment_method,payment_status,payment_provider,total,subtotal,shipping_cost,status,created_at,sales_channel,
        order_items(id,product_name,quantity,unit_price,subtotal,variant_type,variant_value)
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json({ ok: false, error: "Pedido no encontrado" }, 404);

    const isAdmin = profile?.role === "admin";
    const ownsOrder = String(order.user_id) === authData.user.id;
    if (!isAdmin && !ownsOrder) {
      return json({ ok: false, error: "No tienes permiso para enviar este correo" }, 403);
    }

    let recipient = "";
    if (ownsOrder) recipient = authData.user.email || profile?.email || "";
    if (!recipient && order.user_id) {
      const { data: ownerProfile } = await service
        .from("profiles")
        .select("email")
        .eq("id", order.user_id)
        .maybeSingle();
      recipient = ownerProfile?.email || "";

      if (!recipient) {
        const { data: ownerAuth } = await service.auth.admin.getUserById(order.user_id);
        recipient = ownerAuth?.user?.email || "";
      }
    }

    if (!recipient) {
      return json({ ok: false, error: "El cliente no tiene correo registrado" }, 409);
    }

    const items = Array.isArray(order.order_items) ? order.order_items : [];
    const itemsHtml = items
      .map((item: any) => {
        const variant = item.variant_value
          ? `<div style="font-size:12px;color:#6b7280;margin-top:3px">${escapeHtml(item.variant_type === "shoe_size" ? "Número" : "Talla")}: ${escapeHtml(item.variant_value)}</div>`
          : "";
        return `
          <tr>
            <td style="padding:14px 0;border-bottom:1px solid #eeeeee">
              <div style="font-weight:800;color:#111111">${escapeHtml(item.product_name)}</div>
              ${variant}
              <div style="font-size:12px;color:#6b7280;margin-top:3px">Cantidad: ${Number(item.quantity || 1)}</div>
            </td>
            <td style="padding:14px 0;border-bottom:1px solid #eeeeee;text-align:right;font-weight:800;color:#111111;white-space:nowrap">
              ${money(item.subtotal ?? Number(item.unit_price || 0) * Number(item.quantity || 1))}
            </td>
          </tr>`;
      })
      .join("");

    const orderCode = shortOrder(order.id);
    const shippingAddress = [
      order.customer_address,
      order.customer_district,
      order.customer_province,
      order.customer_department,
    ]
      .filter(Boolean)
      .join(", ");

    const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111111">
  <div style="max-width:640px;margin:0 auto;padding:28px 14px">
    <div style="background:#111111;border-radius:18px 18px 0 0;padding:24px 28px;text-align:center">
      <div style="font-size:22px;font-weight:900;color:#ffffff">THE HOUSE OF SPORTS</div>
      <div style="font-size:12px;font-weight:800;color:#ff4b13;margin-top:6px;letter-spacing:1px">PEDIDO CONFIRMADO</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:28px">
      <h1 style="font-size:24px;margin:0 0 10px">¡Gracias por tu compra, ${escapeHtml(order.customer_name || "cliente")}!</h1>
      <p style="color:#555555;line-height:1.6;margin:0 0 22px">Recibimos correctamente tu pedido <strong>#${orderCode}</strong>. Te avisaremos por correo cuando cambie de estado.</p>

      <div style="background:#fff4ef;border:1px solid #ffd7c8;border-radius:14px;padding:16px;margin-bottom:22px">
        <div style="font-size:12px;color:#8a3b20;font-weight:800;text-transform:uppercase">Estado actual</div>
        <div style="font-size:18px;font-weight:900;margin-top:4px;text-transform:capitalize">${escapeHtml(order.status || "pendiente")}</div>
      </div>

      <h2 style="font-size:16px;margin:0 0 8px">Resumen del pedido</h2>
      <table style="width:100%;border-collapse:collapse">${itemsHtml}</table>

      <table style="width:100%;margin-top:18px;font-size:14px">
        <tr><td style="padding:5px 0;color:#666666">Subtotal</td><td style="padding:5px 0;text-align:right">${money(order.subtotal)}</td></tr>
        <tr><td style="padding:5px 0;color:#666666">Envío</td><td style="padding:5px 0;text-align:right">${money(order.shipping_cost)}</td></tr>
        <tr><td style="padding:10px 0 0;font-size:18px;font-weight:900">Total</td><td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:900;color:#ff4b13">${money(order.total)}</td></tr>
      </table>

      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eeeeee;font-size:13px;line-height:1.6;color:#555555">
        <strong style="color:#111111">Entrega</strong><br>${escapeHtml(shippingAddress || "Por coordinar")}
        ${order.customer_reference ? `<br>Referencia: ${escapeHtml(order.customer_reference)}` : ""}
        ${order.customer_phone ? `<br>Teléfono: ${escapeHtml(order.customer_phone)}` : ""}
      </div>

      <p style="font-size:12px;color:#888888;line-height:1.6;margin:24px 0 0">Si necesitas ayuda, responde este correo o escríbenos a admi.ths.pe@gmail.com.</p>
    </div>
  </div>
</body></html>`;

    const sent = await sendResendEmail({
      apiKey: resendApiKey,
      from: fromEmail,
      to: recipient,
      replyTo,
      subject: `Pedido #${orderCode} confirmado · The House of Sports`,
      html,
    });

    return json({ ok: true, emailSent: true, emailId: sent?.id || null, orderId, to: recipient });
  } catch (error) {
    console.error("send-order-email error:", error);
    return json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo enviar el correo" },
      500,
    );
  }
});
