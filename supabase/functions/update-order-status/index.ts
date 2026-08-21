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

const allowedStatuses = ["pendiente", "preparando", "enviado", "entregado", "cancelado"] as const;
type OrderStatus = (typeof allowedStatuses)[number];

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const shortOrder = (id: string) => String(id || "").replaceAll("-", "").slice(0, 8).toUpperCase();

const statusInfo: Record<OrderStatus, { title: string; text: string; accent: string }> = {
  pendiente: {
    title: "Pedido recibido",
    text: "Tu pedido fue recibido y se encuentra pendiente de preparación.",
    accent: "#f59e0b",
  },
  preparando: {
    title: "Estamos preparando tu pedido",
    text: "Nuestro equipo ya está preparando tu compra para el despacho.",
    accent: "#2563eb",
  },
  enviado: {
    title: "Tu pedido está en camino",
    text: "Tu pedido fue despachado. Si corresponde, nuestro equipo te compartirá los datos de entrega o seguimiento.",
    accent: "#7c3aed",
  },
  entregado: {
    title: "Pedido entregado",
    text: "Marcamos tu pedido como entregado. Gracias por comprar en The House of Sports.",
    accent: "#16a34a",
  },
  cancelado: {
    title: "Pedido cancelado",
    text: "Tu pedido fue marcado como cancelado. Si tienes alguna duda, comunícate con nuestro equipo.",
    accent: "#dc2626",
  },
};

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

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return json({ ok: false, error: "No autenticado" }, 401);

    const caller = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return json({ ok: false, error: "Sesión inválida" }, 401);

    const { data: adminProfile } = await service
      .from("profiles")
      .select("role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (adminProfile?.role !== "admin" || adminProfile?.is_active === false) {
      return json({ ok: false, error: "Solo un administrador puede cambiar el estado" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    const status = String(body?.status || "").trim().toLowerCase() as OrderStatus;

    if (!orderId) return json({ ok: false, error: "Falta orderId" }, 400);
    if (!allowedStatuses.includes(status)) {
      return json({ ok: false, error: "Estado inválido" }, 400);
    }

    const { data: order, error: orderError } = await service
      .from("orders")
      .select("id,user_id,customer_name,status,sales_channel")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) return json({ ok: false, error: "Pedido no encontrado" }, 404);

    const previousStatus = String(order.status || "pendiente");
    if (previousStatus === status) {
      return json({
        ok: true,
        status,
        previousStatus,
        unchanged: true,
        emailSent: false,
        warning: "El pedido ya tenía ese estado; no se envió un correo duplicado.",
      });
    }

    const { error: updateError } = await service.from("orders").update({ status }).eq("id", orderId);
    if (updateError) throw updateError;

    // Las ventas presenciales quedan actualizadas, pero evitamos correo si no hay email o si no corresponde.
    let recipient = "";
    if (order.user_id) {
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
      return json({
        ok: true,
        status,
        previousStatus,
        emailSent: false,
        warning: "Estado actualizado, pero el cliente no tiene correo registrado.",
      });
    }

    if (!resendApiKey || !fromEmail) {
      return json({
        ok: true,
        status,
        previousStatus,
        emailSent: false,
        warning: "Estado actualizado, pero faltan RESEND_API_KEY o RESEND_FROM_EMAIL.",
      });
    }

    try {
      const info = statusInfo[status];
      const orderCode = shortOrder(order.id);
      const html = `<!doctype html>
<html><body style="margin:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#111111">
  <div style="max-width:620px;margin:0 auto;padding:28px 14px">
    <div style="background:#111111;border-radius:18px 18px 0 0;padding:24px 28px;text-align:center">
      <div style="font-size:22px;font-weight:900;color:#ffffff">THE HOUSE OF SPORTS</div>
      <div style="font-size:12px;font-weight:800;color:#ff4b13;margin-top:6px;letter-spacing:1px">ACTUALIZACIÓN DE PEDIDO</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:30px">
      <p style="font-size:14px;color:#555555;margin:0 0 8px">Hola ${escapeHtml(order.customer_name || "cliente")},</p>
      <h1 style="font-size:25px;line-height:1.2;margin:0 0 14px">${escapeHtml(info.title)}</h1>
      <p style="font-size:15px;color:#555555;line-height:1.7;margin:0 0 24px">${escapeHtml(info.text)}</p>

      <div style="border:1px solid #eeeeee;border-radius:14px;padding:18px">
        <div style="font-size:12px;color:#777777;font-weight:800;text-transform:uppercase">Pedido</div>
        <div style="font-size:18px;font-weight:900;margin-top:4px">#${orderCode}</div>
        <div style="height:1px;background:#eeeeee;margin:15px 0"></div>
        <div style="font-size:12px;color:#777777;font-weight:800;text-transform:uppercase">Nuevo estado</div>
        <div style="display:inline-block;margin-top:7px;padding:7px 12px;border-radius:999px;background:${info.accent}18;color:${info.accent};font-size:12px;font-weight:900;text-transform:uppercase">${escapeHtml(status)}</div>
      </div>

      <p style="font-size:12px;color:#888888;line-height:1.6;margin:24px 0 0">Puedes revisar el estado actualizado ingresando a tu cuenta en thehouseofsports.pe. Si necesitas ayuda, responde este correo o escríbenos a admi.ths.pe@gmail.com.</p>
    </div>
  </div>
</body></html>`;

      const sent = await sendResendEmail({
        apiKey: resendApiKey,
        from: fromEmail,
        to: recipient,
        replyTo,
        subject: `${info.title} · Pedido #${orderCode} · The House of Sports`,
        html,
      });

      return json({
        ok: true,
        status,
        previousStatus,
        emailSent: true,
        emailId: sent?.id || null,
        to: recipient,
      });
    } catch (emailError) {
      console.error("Estado actualizado, pero falló Resend:", emailError);
      return json({
        ok: true,
        status,
        previousStatus,
        emailSent: false,
        warning: emailError instanceof Error ? emailError.message : "No se pudo enviar el correo",
      });
    }
  } catch (error) {
    console.error("update-order-status error:", error);
    return json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el estado" },
      500,
    );
  }
});
