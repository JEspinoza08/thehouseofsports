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

type CartInput = {
  product_id: string | number;
  variant_id?: string | null;
  quantity: number;
  combo_id?: string | null;
  combo_group_id?: string | null;
  customization?: {
    option_id?: string | null;
    text?: string;
    number?: string;
    flag_type?: string;
    flag_value?: string;
  } | null;
};

const money = (value: unknown) => Math.round(Number(value || 0) * 100) / 100;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const culqiPrivateKey = Deno.env.get("CULQI_PRIVATE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey || !culqiPrivateKey) {
      return json({ ok: false, error: "Faltan secretos requeridos en la Edge Function" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ ok: false, error: "Debes iniciar sesión para pagar" }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const service = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user?.email) {
      return json({ ok: false, error: "Sesión inválida" }, 401);
    }

    const { data: profile } = await service
      .from("profiles")
      .select("is_active")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profile?.is_active === false) {
      return json({ ok: false, error: "Tu cuenta se encuentra inactiva" }, 403);
    }

    const body = await req.json();
    const sourceId = String(body?.source_id || "").trim();
    const requestedInstallments = Number(body?.installments ?? 0);
    const installments =
      Number.isInteger(requestedInstallments) && requestedInstallments >= 0
        ? requestedInstallments
        : 0;
    const rawCart = Array.isArray(body?.cart) ? (body.cart as CartInput[]) : [];
    const customer = body?.customer || {};

    if (!sourceId.startsWith("tkn_")) {
      return json({ ok: false, error: "Token de tarjeta Culqi inválido" }, 400);
    }
    if (rawCart.length === 0) {
      return json({ ok: false, error: "El carrito está vacío" }, 400);
    }

    const productIds = [...new Set(rawCart.map((item) => Number(item.product_id)).filter(Number.isFinite))];
    const { data: products, error: productsError } = await service
      .from("products")
      .select("id,name,price,stock,is_active,has_variants,personalization_enabled")
      .in("id", productIds);
    if (productsError) throw productsError;

    const productMap = new Map((products || []).map((p: any) => [String(p.id), p]));

    const comboIds = [...new Set(rawCart.map((item) => item.combo_id).filter((id): id is string => Boolean(id)))];
    const { data: combos, error: combosError } = comboIds.length
      ? await service.from("product_combos").select("id,title,product_ids,combo_price,is_active").in("id", comboIds)
      : { data: [], error: null } as any;
    if (combosError) throw combosError;
    const comboMap = new Map((combos || []).map((c: any) => [String(c.id), c]));

    const comboGroups = new Map<string, CartInput[]>();
    for (const input of rawCart) {
      if (!input.combo_group_id) continue;
      const key = String(input.combo_group_id);
      comboGroups.set(key, [...(comboGroups.get(key) || []), input]);
    }
    for (const [groupId, groupItems] of comboGroups) {
      const comboId = String(groupItems[0]?.combo_id || "");
      const combo = comboMap.get(comboId);
      if (!combo || combo.is_active === false || groupItems.some((item) => String(item.combo_id || "") !== comboId)) {
        return json({ ok: false, error: "Uno de los combos ya no está disponible" }, 409);
      }
      const expected = (Array.isArray(combo.product_ids) ? combo.product_ids : []).map(String).sort();
      const received = groupItems.map((item) => String(item.product_id)).sort();
      if (expected.length !== received.length || expected.some((id: string, index: number) => id !== received[index]) || groupItems.some((item) => Number(item.quantity) !== 1)) {
        return json({ ok: false, error: `El combo ${combo.title || groupId} está incompleto o fue modificado` }, 409);
      }
    }

    const variantIds = rawCart
      .map((item) => item.variant_id)
      .filter((id): id is string => Boolean(id));

    const { data: variants, error: variantsError } = variantIds.length
      ? await service
          .from("product_variants")
          .select("id,product_id,variant_type,variant_value,color_name,color_hex,stock,is_active")
          .in("id", variantIds)
      : { data: [], error: null } as any;
    if (variantsError) throw variantsError;

    const variantMap = new Map((variants || []).map((v: any) => [String(v.id), v]));

    const customizationIds = rawCart
      .map((item) => item.customization?.option_id)
      .filter((id): id is string => Boolean(id));

    const { data: customizationOptions, error: customizationError } = customizationIds.length
      ? await service
          .from("product_customization_options")
          .select("id,product_id,label,price,requires_text,requires_number,requires_flag,is_active")
          .in("id", customizationIds)
      : { data: [], error: null } as any;
    if (customizationError) throw customizationError;

    const customizationMap = new Map((customizationOptions || []).map((o: any) => [String(o.id), o]));
    const items: any[] = [];
    let subtotal = 0;

    for (const input of rawCart) {
      const product = productMap.get(String(input.product_id));
      const quantity = Number(input.quantity);

      if (!product || product.is_active === false) {
        return json({ ok: false, error: "Uno de los productos ya no está disponible" }, 409);
      }
      if (!Number.isInteger(quantity) || quantity < 1) {
        return json({ ok: false, error: "Cantidad inválida en el carrito" }, 400);
      }

      let variant: any = null;
      if (input.variant_id) {
        variant = variantMap.get(String(input.variant_id));
        if (!variant || String(variant.product_id) !== String(product.id) || variant.is_active === false) {
          return json({ ok: false, error: `La variante de ${product.name} ya no está disponible` }, 409);
        }
        if (Number(variant.stock) < quantity) {
          return json({ ok: false, error: `Stock insuficiente para ${product.name} (${variant.variant_value})` }, 409);
        }
      } else if (Number(product.stock) < quantity) {
        return json({ ok: false, error: `Stock insuficiente para ${product.name}` }, 409);
      }

      let customization: any = null;
      let customizationSurcharge = 0;

      if (input.customization?.option_id) {
        if (!product.personalization_enabled) {
          return json({ ok: false, error: `${product.name} ya no permite personalización` }, 409);
        }

        const option = customizationMap.get(String(input.customization.option_id));
        if (!option || String(option.product_id) !== String(product.id) || option.is_active === false) {
          return json({ ok: false, error: `La personalización de ${product.name} ya no está disponible` }, 409);
        }

        const customText = String(input.customization.text || "").trim().slice(0, 20);
        const customNumber = String(input.customization.number || "").trim().slice(0, 3);
        const flagType = String(input.customization.flag_type || "country").trim();
        const flagValue = String(input.customization.flag_value || "").trim().slice(0, 30);

        const isEitherTextOrNumber = String(option.label || "").toLowerCase().includes("y/o");
        if (isEitherTextOrNumber && !customText && !customNumber) {
          return json({ ok: false, error: `Falta el nombre/texto o número de personalización para ${product.name}` }, 400);
        }
        if (!isEitherTextOrNumber && option.requires_text && !customText) {
          return json({ ok: false, error: `Falta el texto de personalización para ${product.name}` }, 400);
        }
        if (!isEitherTextOrNumber && option.requires_number && !customNumber) {
          return json({ ok: false, error: `Falta el número de personalización para ${product.name}` }, 400);
        }
        if (option.requires_flag && !flagValue) {
          return json({ ok: false, error: `Falta la bandera o emoji para ${product.name}` }, 400);
        }

        customizationSurcharge = money(option.price);
        const parts = [
          customText ? `Texto: ${customText}` : "",
          customNumber ? `Número: ${customNumber}` : "",
          flagValue ? `${flagType === "emoji" ? "Emoji" : "País"}: ${flagValue}` : "",
        ].filter(Boolean);

        customization = {
          option_id: option.id,
          option_label: option.label,
          surcharge: customizationSurcharge,
          text: customText,
          number: customNumber,
          flag_type: flagType,
          flag_value: flagValue,
          summary: `${option.label}${parts.length ? ` · ${parts.join(" · ")}` : ""}`,
        };
      }

      let basePrice = Number(product.price);
      if (input.combo_id && input.combo_group_id) {
        const combo = comboMap.get(String(input.combo_id));
        const comboProductIds = (Array.isArray(combo?.product_ids) ? combo.product_ids : []).map(String);
        const comboRegularTotal = comboProductIds.reduce((sum: number, productId: string) => sum + Number(productMap.get(productId)?.price || 0), 0);
        const comboPrice = Number(combo?.combo_price || comboRegularTotal);
        if (comboRegularTotal > 0) basePrice = basePrice * (comboPrice / comboRegularTotal);
      }

      const unitPrice = money(basePrice + customizationSurcharge);
      subtotal += unitPrice * quantity;
      items.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        variant_id: variant?.id ?? null,
        variant_type: variant?.variant_type ?? null,
        variant_value: variant?.variant_value ?? null,
        color_name: variant?.color_name ?? null,
        color_hex: variant?.color_hex ?? null,
        customization,
        combo_id: input.combo_id ?? null,
        combo_group_id: input.combo_group_id ?? null,
      });
    }

    const department = String(customer?.department || "").trim();
    const province = String(customer?.province || "").trim();
    const district = String(customer?.district || "").trim();

    const { data: shipping, error: shippingError } = await service
      .from("shipping_rates")
      .select("price")
      .eq("department", department)
      .eq("province", province)
      .eq("district", district)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (shippingError) throw shippingError;
    if (!shipping) {
      return json({ ok: false, error: "La tarifa de envío seleccionada ya no está disponible" }, 409);
    }

    subtotal = money(subtotal);
    const shippingCost = subtotal >= 400 ? 0 : money(shipping.price);
    const total = money(subtotal + shippingCost);
    const amountInCents = Math.round(total * 100);

    if (amountInCents < 100) {
      return json({ ok: false, error: "El monto del pago no es válido" }, 400);
    }

    const fullName = String(customer?.name || "Cliente").trim();
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || "THS";
    const phone = String(customer?.phone || "").replace(/\D/g, "");

    const chargePayload = {
      amount: amountInCents,
      currency_code: "PEN",
      email: authData.user.email,
      source_id: sourceId,
      description: "Compra The House of Sports",
      installments,
      metadata: {
        user_id: authData.user.id,
        customer_dni: String(customer?.dni || ""),
        sales_channel: "online",
      },
      antifraud_details: {
        first_name: firstName,
        last_name: lastName,
        address: String(customer?.address || "").trim(),
        address_city: district,
        country_code: "PE",
        phone_number: phone,
      },
    };

    const culqiResponse = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${culqiPrivateKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargePayload),
    });

    const culqiData = await culqiResponse.json();

    if (!culqiResponse.ok) {
      const declineCode =
        culqiData?.decline_code ||
        culqiData?.outcome?.decline_code ||
        culqiData?.code ||
        culqiData?.param ||
        culqiData?.type;

      const errorMessages: Record<string, string> = {
        insufficient_funds: "La tarjeta no tiene fondos suficientes.",
        stolen_card: "La tarjeta fue reportada como robada.",
        lost_card: "La tarjeta fue reportada como perdida.",
        incorrect_cvv: "El código de seguridad CVV es incorrecto.",
        invalid_card: "La tarjeta ingresada no es válida.",
        expired_card: "La tarjeta está vencida.",
        contact_issuer: "Comunícate con el banco emisor de la tarjeta.",
        parameter_error: "Hay datos inválidos en el pago. Revisa la información ingresada.",
        foreign_card_not_enabled: "Tu comercio Culqi todavía no tiene habilitadas las tarjetas internacionales.",
      };

      return json({
        ok: false,
        error:
          errorMessages[String(declineCode)] ||
          culqiData?.user_message ||
          culqiData?.merchant_message ||
          culqiData?.message ||
          "No se pudo procesar el pago con Culqi.",
        decline_code: declineCode || null,
      });
    }

    return json({
      ok: true,
      charge: culqiData,
      summary: {
        subtotal,
        shipping_cost: shippingCost,
        total,
      },
      items,
    });
  } catch (error) {
    console.error("create-payment error:", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo procesar el pago",
      },
      500,
    );
  }
});
