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

const allowedMethods = ["delivery", "pickup"] as const;
type DeliveryMethod = (typeof allowedMethods)[number];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
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

    const body = await req.json().catch(() => ({}));
    const orderId = String(body?.orderId || "").trim();
    const deliveryMethod = String(body?.deliveryMethod || "delivery").trim().toLowerCase() as DeliveryMethod;
    if (!orderId) return json({ ok: false, error: "Falta orderId" }, 400);
    if (!allowedMethods.includes(deliveryMethod)) return json({ ok: false, error: "Tipo de entrega inválido" }, 400);

    const { data: order, error: orderError } = await service
      .from("orders")
      .select("id,user_id,status")
      .eq("id", orderId)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) return json({ ok: false, error: "Pedido no encontrado" }, 404);

    const { data: profile } = await service
      .from("profiles")
      .select("role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    const isAdmin = profile?.role === "admin" && profile?.is_active !== false;
    const ownsOrder = String(order.user_id) === authData.user.id;
    if (!isAdmin && !ownsOrder) return json({ ok: false, error: "No tienes permiso para modificar este pedido" }, 403);

    const updates: Record<string, unknown> = { delivery_method: deliveryMethod };
    // Los retiros pagados entran directamente a preparación; luego el admin los pasa a listo_para_recoger.
    if (deliveryMethod === "pickup" && String(order.status || "pendiente") === "pendiente") {
      updates.status = "preparando";
    }

    const { data: updated, error: updateError } = await service
      .from("orders")
      .update(updates)
      .eq("id", orderId)
      .select("id,delivery_method,status")
      .single();
    if (updateError) throw updateError;

    return json({ ok: true, order: updated });
  } catch (error) {
    console.error("set-order-delivery-method error:", error);
    return json({ ok: false, error: error instanceof Error ? error.message : "No se pudo guardar el tipo de entrega" }, 500);
  }
});
