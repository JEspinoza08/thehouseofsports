import { supabase } from "../lib/supabase";

export async function createOrder({
  userId,
  customer,
  paymentMethod,
  cart,
  totalPrice,
  subtotal,
  shippingCost,
  paymentData = null,
}: any) {
  if (!userId) {
    throw new Error("Usuario no autenticado.");
  }

  if (!cart || cart.length === 0) {
    throw new Error("El carrito está vacío.");
  }

  if (!/^\d{8}$/.test(customer?.dni ?? "")) {
  throw new Error("El DNI debe contener exactamente 8 dígitos.");
}

  const orderData = {
    user_id: userId,

    customer_name: customer.name,
    customer_dni: customer.dni,
    customer_phone: customer.phone,
    customer_address: customer.address,
    customer_department: customer.department,
    customer_province: customer.province,
    customer_district: customer.district,
    customer_reference: customer.reference || null,
    customer_zone:
      customer.department === "Lima" ? "Lima" : "Provincia",

    payment_method: paymentMethod,
    payment_provider: paymentData?.provider ?? null,
    payment_status: paymentData?.status ?? "pending",
    payment_transaction_id: paymentData?.transactionId ?? null,
    payment_reference: paymentData?.reference ?? null,
    card_brand: paymentData?.cardBrand ?? null,
    installments: paymentData?.installments ?? 1,
    paid_at: paymentData?.paidAt ?? null,

    subtotal,
    shipping_cost: shippingCost,
    total: totalPrice,
  };

  const items = cart.map((item: any) => ({
    product_id: item.id,
    product_name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,

    variant_id: item.selectedVariant?.id ?? null,
    variant_type: item.selectedVariant?.type ?? null,
    variant_value: item.selectedVariant?.value ?? null,
  }));

  const { data: order, error } = await supabase.rpc(
    "create_complete_order",
    {
      p_order: orderData,
      p_items: items,
    }
  );

  if (error) {
    console.error("Error creando la orden:", error);

    const errorMessage = error.message?.toLowerCase() ?? "";

    if (
      errorMessage.includes("stock") ||
      errorMessage.includes("insuficiente")
    ) {
      throw new Error(
        "Uno de los productos ya no tiene stock suficiente. Actualiza tu carrito."
      );
    }

    throw new Error(
      error.message || "No se pudo crear la orden."
    );
  }

  const firstResult = Array.isArray(order) ? order[0] : order;
  const orderId =
    typeof firstResult === "string"
      ? firstResult
      : firstResult?.id ?? firstResult?.order_id ?? firstResult?.create_complete_order ?? null;

  const customizedItems = cart.filter((item: any) => item.selectedCustomization);

  if (orderId && customizedItems.length > 0) {
    try {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("id,product_id,variant_id,unit_price")
        .eq("order_id", orderId);

      if (orderItemsError) throw orderItemsError;

      const used = new Set<string>();
      const customizationRows = customizedItems.map((cartItem: any) => {
        const match = (orderItems || []).find((row: any) => {
          const key = String(row.id);
          if (used.has(key)) return false;
          return (
            String(row.product_id) === String(cartItem.id) &&
            String(row.variant_id || "") === String(cartItem.selectedVariant?.id || "") &&
            Math.abs(Number(row.unit_price || 0) - Number(cartItem.price || 0)) < 0.01
          );
        });

        if (!match) return null;
        used.add(String(match.id));
        const custom = cartItem.selectedCustomization;
        return {
          order_item_id: String(match.id),
          order_id: orderId,
          product_id: cartItem.id,
          option_id: custom.optionId,
          option_label: custom.optionLabel,
          surcharge: Number(custom.price || 0),
          custom_text: custom.text || null,
          custom_number: custom.number || null,
          flag_type: custom.flagType || null,
          flag_value: custom.flagValue || null,
          summary: custom.summary || custom.optionLabel,
        };
      }).filter(Boolean);

      if (customizationRows.length > 0) {
        const { error: customizationError } = await supabase
          .from("order_item_customizations")
          .insert(customizationRows);
        if (customizationError) throw customizationError;
      }
    } catch (customizationError) {
      console.error("La orden se creó, pero no se pudo guardar el detalle de personalización:", customizationError);
    }
  }

  return order;
}