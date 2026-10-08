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

const money = (value: unknown) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
const decimal = (value: unknown, digits = 10) => Number(Number(value || 0).toFixed(digits));

const peruDate = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  return parts.replaceAll("/", "-");
};

const clean = (value: unknown) => String(value ?? "").trim();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ ok: false, error: "Faltan variables de Supabase en emit-nubefact" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return json({ ok: false, error: "No autenticado" }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(jwt);
    if (authError || !authData.user) return json({ ok: false, error: "Sesión inválida" }, 401);

    const service = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json().catch(() => ({}));
    const orderId = clean(body?.orderId);
    const retry = Boolean(body?.retry);
    const billing = body?.billing || {};
    if (!orderId) return json({ ok: false, error: "Falta orderId" }, 400);

    const { data: profile } = await service
      .from("profiles")
      .select("role,is_active")
      .eq("id", authData.user.id)
      .maybeSingle();
    const isAdmin = profile?.role === "admin" && profile?.is_active !== false;

    const { data: order, error: orderError } = await service
      .from("orders")
      .select(`
        id,user_id,payment_status,total,subtotal,shipping_cost,
        customer_name,customer_dni,customer_address,customer_department,
        customer_province,customer_district,customer_phone,
        order_items(id,product_id,product_name,quantity,unit_price,subtotal,variant_type,variant_value)
      `)
      .eq("id", orderId)
      .single();
    if (orderError || !order) return json({ ok: false, error: "Pedido no encontrado" }, 404);
    if (!isAdmin && String(order.user_id) !== authData.user.id) {
      return json({ ok: false, error: "No puedes emitir el comprobante de otro pedido" }, 403);
    }
    if (order.payment_status !== "paid") {
      return json({ ok: false, error: "Solo se puede emitir un comprobante para un pedido pagado" }, 409);
    }

    const { data: existing } = await service
      .from("electronic_documents")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing?.status === "issued") {
      return json({ ok: true, alreadyIssued: true, status: existing.status, document: existing });
    }
    if (existing && !retry && body?.billing) {
      return json({ ok: false, error: "Ya existe un intento de emisión. Usa reintentar para conservar el mismo correlativo." }, 409);
    }

    const mode = clean(Deno.env.get("NUBEFACT_MODE") || "demo").toLowerCase() === "production"
      ? "production"
      : "demo";
    const route = mode === "production"
      ? clean(Deno.env.get("NUBEFACT_PROD_URL"))
      : clean(Deno.env.get("NUBEFACT_DEMO_URL"));
    const token = mode === "production"
      ? clean(Deno.env.get("NUBEFACT_PROD_TOKEN"))
      : clean(Deno.env.get("NUBEFACT_DEMO_TOKEN"));

    if (!route || !token) {
      return json({ ok: false, error: `NubeFact ${mode.toUpperCase()} no está configurado: falta RUTA o TOKEN.` }, 500);
    }

    const documentType = existing?.document_type || (clean(billing?.type) === "factura" ? "factura" : "boleta");
    const documentTypeCode = documentType === "factura" ? 1 : 2;
    const series = existing?.series || clean(
      documentType === "factura"
        ? Deno.env.get("NUBEFACT_FACTURA_SERIE") || "FFF1"
        : Deno.env.get("NUBEFACT_BOLETA_SERIE") || "BBB1",
    ).toUpperCase();

    if (series.length !== 4 || (documentType === "factura" ? !series.startsWith("F") : !series.startsWith("B"))) {
      return json({ ok: false, error: `Serie NubeFact inválida para ${documentType}: ${series || "(vacía)"}` }, 500);
    }

    let customerDocumentType: number;
    let customerDocumentNumber: string;
    let customerName: string;
    let customerAddress: string;

    if (existing) {
      customerDocumentType = Number(existing.customer_document_type);
      customerDocumentNumber = clean(existing.customer_document_number);
      customerName = clean(existing.customer_name);
      customerAddress = clean(existing.customer_address);
    } else if (documentType === "factura") {
      customerDocumentType = 6;
      customerDocumentNumber = clean(billing?.ruc).replace(/\D/g, "");
      customerName = clean(billing?.businessName);
      customerAddress = clean(billing?.fiscalAddress);
      if (!/^\d{11}$/.test(customerDocumentNumber)) {
        return json({ ok: false, error: "Para factura se requiere un RUC válido de 11 dígitos" }, 400);
      }
      if (!customerName) return json({ ok: false, error: "Para factura se requiere razón social" }, 400);
      if (!customerAddress) return json({ ok: false, error: "Para factura se requiere dirección fiscal" }, 400);
    } else {
      customerDocumentType = 1;
      customerDocumentNumber = clean(order.customer_dni).replace(/\D/g, "");
      customerName = clean(order.customer_name);
      customerAddress = clean(order.customer_address);
      if (!/^\d{8}$/.test(customerDocumentNumber)) {
        return json({ ok: false, error: "Para boleta se requiere un DNI válido de 8 dígitos" }, 400);
      }
    }

    const customerEmail = existing?.customer_email || clean(billing?.email || authData.user.email);
    const orderItems = Array.isArray(order.order_items) ? order.order_items : [];
    if (!orderItems.length) return json({ ok: false, error: "El pedido no tiene productos" }, 409);

    const nubefactItems: any[] = [];
    let totalGravada = 0;
    let totalIgv = 0;
    let computedTotal = 0;

    for (const item of orderItems) {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const grossUnit = money(item.unit_price);
      const grossTotal = money(item.subtotal ?? grossUnit * quantity);
      const netUnit = decimal(grossUnit / 1.18);
      const netSubtotal = money(grossTotal / 1.18);
      const igv = money(grossTotal - netSubtotal);
      const variant = clean(item.variant_value);
      const variantLabel = variant ? ` · ${clean(item.variant_type) === "shoe_size" ? "Número" : "Talla"}: ${variant}` : "";

      totalGravada = money(totalGravada + netSubtotal);
      totalIgv = money(totalIgv + igv);
      computedTotal = money(computedTotal + grossTotal);

      nubefactItems.push({
        unidad_de_medida: "NIU",
        codigo: clean(item.product_id || item.id).slice(0, 30),
        descripcion: `${clean(item.product_name)}${variantLabel}`.slice(0, 500),
        cantidad: quantity,
        valor_unitario: netUnit,
        precio_unitario: grossUnit,
        descuento: "",
        subtotal: netSubtotal,
        tipo_de_igv: 1,
        igv,
        total: grossTotal,
        anticipo_regularizacion: false,
        anticipo_documento_serie: "",
        anticipo_documento_numero: "",
      });
    }

    const shippingCost = money(order.shipping_cost);
    if (shippingCost > 0) {
      const shippingNet = money(shippingCost / 1.18);
      const shippingIgv = money(shippingCost - shippingNet);
      totalGravada = money(totalGravada + shippingNet);
      totalIgv = money(totalIgv + shippingIgv);
      computedTotal = money(computedTotal + shippingCost);
      nubefactItems.push({
        unidad_de_medida: "NIU",
        codigo: "ENVIO",
        descripcion: `Servicio de envío - ${clean(order.customer_district)}, ${clean(order.customer_province)}`.slice(0, 500),
        cantidad: 1,
        valor_unitario: decimal(shippingCost / 1.18),
        precio_unitario: shippingCost,
        descuento: "",
        subtotal: shippingNet,
        tipo_de_igv: 1,
        igv: shippingIgv,
        total: shippingCost,
        anticipo_regularizacion: false,
        anticipo_documento_serie: "",
        anticipo_documento_numero: "",
      });
    }

    const orderTotal = money(order.total);
    if (Math.abs(computedTotal - orderTotal) > 0.02) {
      return json({
        ok: false,
        error: `El total del comprobante (${computedTotal}) no coincide con el total pagado (${orderTotal}).`,
      }, 409);
    }

    let number = Number(existing?.number || 0);
    if (!number) {
      const { data: reserved, error: reserveError } = await service.rpc("reserve_electronic_document_number", {
        p_document_type: documentType,
        p_series: series,
      });
      if (reserveError || !reserved) throw reserveError || new Error("No se pudo reservar correlativo");
      number = Number(reserved);
    }

    const payload = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: documentTypeCode,
      serie: series,
      numero: number,
      sunat_transaction: 1,
      cliente_tipo_de_documento: customerDocumentType,
      cliente_numero_de_documento: customerDocumentNumber,
      cliente_denominacion: customerName,
      cliente_direccion: customerAddress,
      cliente_email: customerEmail,
      cliente_email_1: "",
      cliente_email_2: "",
      fecha_de_emision: peruDate(),
      fecha_de_vencimiento: "",
      moneda: 1,
      tipo_de_cambio: "",
      porcentaje_de_igv: 18,
      descuento_global: "",
      total_descuento: "",
      total_anticipo: "",
      total_gravada: totalGravada,
      total_inafecta: "",
      total_exonerada: "",
      total_igv: totalIgv,
      total_gratuita: "",
      total_otros_cargos: "",
      total: orderTotal,
      percepcion_tipo: "",
      percepcion_base_imponible: "",
      total_percepcion: "",
      total_incluido_percepcion: "",
      retencion_tipo: "",
      retencion_base_imponible: "",
      total_retencion: "",
      detraccion: false,
      observaciones: `Pedido THS #${order.id.slice(0, 8).toUpperCase()} · ${mode.toUpperCase()}`,
      documento_que_se_modifica_tipo: "",
      documento_que_se_modifica_serie: "",
      documento_que_se_modifica_numero: "",
      tipo_de_nota_de_credito: "",
      tipo_de_nota_de_debito: "",
      enviar_automaticamente_a_la_sunat: true,
      enviar_automaticamente_al_cliente: mode === "production",
      codigo_unico: `THS-${mode}-${order.id}`,
      condiciones_de_pago: "",
      medio_de_pago: "",
      placa_vehiculo: "",
      orden_compra_servicio: "",
      tabla_personalizada_codigo: "",
      formato_de_pdf: "",
      items: nubefactItems,
    };

    const baseDocument = {
      order_id: order.id,
      user_id: order.user_id,
      document_type: documentType,
      document_type_code: documentTypeCode,
      series,
      number,
      customer_document_type: customerDocumentType,
      customer_document_number: customerDocumentNumber,
      customer_name: customerName,
      customer_address: customerAddress || null,
      customer_email: customerEmail || null,
      taxable_amount: totalGravada,
      igv: totalIgv,
      total: orderTotal,
      status: "pending",
      nubefact_mode: mode,
      request_payload: payload,
      error_message: null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await service.from("electronic_documents").update(baseDocument).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await service.from("electronic_documents").insert(baseDocument);
      if (error) throw error;
    }

    let response: Response;
    let result: any;
    try {
      response = await fetch(route, {
        method: "POST",
        headers: {
          Authorization: `Token token=${token}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      try {
        result = text ? JSON.parse(text) : {};
      } catch {
        result = { raw_response: text };
      }
    } catch (networkError) {
      const message = networkError instanceof Error ? networkError.message : "No se pudo conectar con NubeFact";
      await service.from("electronic_documents").update({
        status: "error",
        error_message: message,
        response_payload: { network_error: message },
        updated_at: new Date().toISOString(),
      }).eq("order_id", orderId);
      return json({ ok: false, status: "error", error: message }, 502);
    }

    const nubefactError = clean(result?.errors || result?.error || "");
    const rejectedBySunat = result?.aceptada_por_sunat === false && Boolean(clean(result?.sunat_responsecode || result?.sunat_description));
    const status = nubefactError ? "error" : rejectedBySunat ? "rejected" : "issued";
    const errorMessage = nubefactError || (rejectedBySunat ? clean(result?.sunat_description || "SUNAT rechazó el comprobante") : null);

    const updateData = {
      status,
      nubefact_link: result?.enlace || null,
      nubefact_pdf_url: result?.enlace_del_pdf || null,
      nubefact_xml_url: result?.enlace_del_xml || null,
      nubefact_cdr_url: result?.enlace_del_cdr || null,
      accepted_by_sunat: typeof result?.aceptada_por_sunat === "boolean" ? result.aceptada_por_sunat : null,
      sunat_responsecode: clean(result?.sunat_responsecode) || null,
      sunat_description: clean(result?.sunat_description) || null,
      error_message: errorMessage,
      response_payload: result,
      issued_at: status === "issued" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { data: saved, error: saveError } = await service
      .from("electronic_documents")
      .update(updateData)
      .eq("order_id", orderId)
      .select("*")
      .single();
    if (saveError) throw saveError;

    if (!response.ok || status !== "issued") {
      return json({
        ok: false,
        status,
        error: errorMessage || `NubeFact respondió HTTP ${response.status}`,
        document: saved,
        nubefact: result,
      }, response.ok ? 422 : response.status);
    }

    return json({ ok: true, status, document: saved, nubefact: result });
  } catch (error) {
    console.error("emit-nubefact error:", error);
    return json({
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo emitir el comprobante",
    }, 500);
  }
});
