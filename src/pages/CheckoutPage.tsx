import { useEffect, useRef, useState } from "react";
import { CreditCard, Minus, Plus, Trash2 } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useCart } from "../context/CartContext";
import { createOrder } from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  getDepartments,
  getProvinces,
  getDistricts,
  getShippingRate,
} from "../services/shippingService";
import Toast from "../components/Toast";
import CustomSelect from "../components/CustomSelect";
import arqueroCarrito from "../assets/arqueroloading.webp";

declare global {
  interface Window {
    CulqiCheckout?: new (publicKey: string, config: any) => any;
  }
}

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, totalPrice, clearCart, updateQuantity, removeFromCart, getRemainingStock } =
    useCart();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dni, setDni] = useState("");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [receiptType, setReceiptType] = useState<"boleta" | "factura">("boleta");
  const [invoiceRuc, setInvoiceRuc] = useState("");
  const [invoiceBusinessName, setInvoiceBusinessName] = useState("");
  const [invoiceFiscalAddress, setInvoiceFiscalAddress] = useState("");
  const paymentMethod = "tarjeta";
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const culqiCheckoutRef = useRef<any>(null);

  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
  } | null>(null);

  const finalTotal = totalPrice + shippingCost;

  useEffect(() => {
    if (document.getElementById("culqi-custom-checkout-script")) return;

    const script = document.createElement("script");
    script.id = "culqi-custom-checkout-script";
    script.src = "https://js.culqi.com/checkout-js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    getDepartments().then(setDepartments).catch(console.error);
  }, []);

  useEffect(() => {
    if (!department) return;
    setProvince("");
    setDistrict("");
    setShippingCost(0);
    getProvinces(department).then(setProvinces).catch(console.error);
  }, [department]);

  useEffect(() => {
    if (!department || !province) return;
    setDistrict("");
    setShippingCost(0);
    getDistricts(department, province).then(setDistricts).catch(console.error);
  }, [department, province]);

  useEffect(() => {
    if (!department || !province || !district) return;

    getShippingRate(department, province, district)
      .then((rate) => setShippingCost(totalPrice >= 400 ? 0 : Number(rate.price)))
      .catch(console.error);
  }, [department, province, district, totalPrice]);

  const validateCheckout = () => {
    if (!user) {
      setToast({
        type: "warning",
        title: "Inicia sesión",
        message: "Debes iniciar sesión antes de realizar tu compra.",
      });
      return false;
    }

    if (
      !name.trim() ||
      !dni ||
      !phone ||
      !department ||
      !province ||
      !district ||
      !address.trim()
    ) {
      setToast({
        type: "warning",
        title: "Datos incompletos",
        message:
          "Completa nombre, DNI, celular, departamento, provincia, distrito y dirección.",
      });
      return false;
    }

    if (!/^\d{8}$/.test(dni)) {
      setToast({
        type: "warning",
        title: "DNI inválido",
        message: "Ingresa un DNI válido de 8 dígitos.",
      });
      return false;
    }

    if (!/^\d+$/.test(phone)) {
      setToast({
        type: "warning",
        title: "Celular inválido",
        message: "El número de celular solo debe contener números.",
      });
      return false;
    }

    if (phone.length !== 9) {
      setToast({
        type: "warning",
        title: "Celular inválido",
        message: "Ingresa un número de celular válido de 9 dígitos.",
      });
      return false;
    }

    if (address.trim().length < 8) {
      setToast({
        type: "warning",
        title: "Dirección muy corta",
        message: "La dirección debe tener como mínimo 8 caracteres.",
      });
      return false;
    }

    if (receiptType === "factura") {
      if (!/^\d{11}$/.test(invoiceRuc)) {
        setToast({
          type: "warning",
          title: "RUC inválido",
          message: "Para factura ingresa un RUC válido de 11 dígitos.",
        });
        return false;
      }

      if (!invoiceBusinessName.trim()) {
        setToast({
          type: "warning",
          title: "Razón social requerida",
          message: "Ingresa la razón social para emitir la factura.",
        });
        return false;
      }

      if (invoiceFiscalAddress.trim().length < 5) {
        setToast({
          type: "warning",
          title: "Dirección fiscal requerida",
          message: "Ingresa la dirección fiscal para emitir la factura.",
        });
        return false;
      }
    }

    if (cart.length === 0) {
      setToast({
        type: "error",
        title: "Carrito vacío",
        message: "Agrega al menos un producto antes de confirmar tu pedido.",
      });
      return false;
    }

    return true;
  };

  const registerOrder = async (
    paymentData: any = null,
    totalsOverride?: { subtotal: number; shippingCost: number; total: number },
    cartOverride?: any[],
  ) => {
    if (!user) return;

    try {
      const orderResult = await createOrder({
        userId: user.id,
        customer: {
          name,
          dni,
          phone,
          address,
          department,
          province,
          district,
          reference,
        },
        paymentMethod,
        cart: cartOverride ?? cart,
        subtotal: totalsOverride?.subtotal ?? totalPrice,
        shippingCost: totalsOverride?.shippingCost ?? shippingCost,
        totalPrice: totalsOverride?.total ?? finalTotal,
        paymentData,
      });

      const firstResult = Array.isArray(orderResult)
        ? orderResult[0]
        : orderResult;

      const orderId =
        typeof firstResult === "string"
          ? firstResult
          : (firstResult?.id ??
            firstResult?.order_id ??
            firstResult?.create_complete_order ??
            null);

      let invoiceNotice = "El comprobante electrónico quedó pendiente de emisión.";

      if (!orderId || typeof orderId !== "string") {
        console.error("No se pudo obtener el UUID de la orden:", orderResult);
      } else {
        try {
          const { data: invoiceData, error: invoiceError } =
            await supabase.functions.invoke("emit-nubefact", {
              body: {
                orderId,
                billing: {
                  type: receiptType,
                  email: user?.email || "",
                  ruc: receiptType === "factura" ? invoiceRuc : undefined,
                  businessName:
                    receiptType === "factura" ? invoiceBusinessName : undefined,
                  fiscalAddress:
                    receiptType === "factura" ? invoiceFiscalAddress : undefined,
                },
              },
            });

          if (invoiceError || !invoiceData?.ok) {
            let functionError: any = null;
            try {
              functionError = await invoiceError?.context?.json();
            } catch {
              functionError = invoiceData || invoiceError?.message;
            }
            console.error(
              "La orden se creó y pagó, pero NubeFact no pudo emitir:",
              functionError || invoiceData,
            );
            invoiceNotice =
              "Tu pago y pedido quedaron registrados. El comprobante puede reintentarse desde administración.";
          } else {
            const document = invoiceData?.document;
            const label = receiptType === "factura" ? "Factura" : "Boleta";
            invoiceNotice = document?.series && document?.number
              ? `${label} ${document.series}-${String(document.number).padStart(8, "0")} emitida correctamente.`
              : `${label} electrónica emitida correctamente.`;

            // Si NubeFact emitió correctamente, enviamos el comprobante al cliente.
            // En modo pruebas, RESEND_TEST_EMAIL hará que llegue a tu correo de prueba.
            try {
              const { data: documentEmailData, error: documentEmailError } =
                await supabase.functions.invoke("send-electronic-document-email", {
                  body: {
                    orderId,
                  },
                });

              if (documentEmailError || !documentEmailData?.ok) {
                let functionError: unknown = null;

                try {
                  functionError = await documentEmailError?.context?.json();
                } catch {
                  functionError = documentEmailData || documentEmailError?.message;
                }

                console.error(
                  "El comprobante fue emitido, pero falló el envío por correo:",
                  functionError || documentEmailData,
                );
              } else {
                console.log(
                  "Comprobante electrónico enviado:",
                  documentEmailData,
                );
              }
            } catch (documentEmailError) {
              console.error(
                "Error invocando send-electronic-document-email:",
                documentEmailError,
              );
            }
          }
        } catch (invoiceError) {
          console.error("Error invocando emit-nubefact:", invoiceError);
          invoiceNotice =
            "Tu pago y pedido quedaron registrados. El comprobante quedó pendiente de emisión.";
        }

        try {
          const { data: emailData, error: emailError } =
            await supabase.functions.invoke("send-order-email", {
              body: {
                orderId,
              },
            });

          if (emailError) {
            let functionError: unknown = null;

            try {
              functionError = await emailError.context?.json();
            } catch {
              functionError = emailError.message;
            }

            console.error(
              "La orden se creó, pero falló el correo:",
              functionError,
            );
          } else {
            console.log("Correo del pedido enviado:", emailData);
          }
        } catch (emailError) {
          console.error("Error invocando send-order-email:", emailError);
        }
      }

      clearCart();

      setToast({
        type: "success",
        title: "Pedido registrado",
        message: `Tu pedido se registró correctamente. ${invoiceNotice}`,
      });

      setTimeout(() => {
        navigate("/mi-cuenta");
      }, 1000);
    } catch (error: any) {
      console.error("ERROR REGISTRANDO PEDIDO:", error);

      setToast({
        type: "error",
        title: "No se pudo registrar el pedido",
        message:
          error?.message ||
          "Ocurrió un problema al registrar la compra o actualizar el stock.",
      });

      throw error;
    }
  };

  const payWithCulqi = async (tokenId: string, installments = 0) => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-payment",
        {
          body: {
            source_id: tokenId,
            installments,
            cart: cart.map((item) => ({
              product_id: item.id,
              variant_id: item.selectedVariant?.id ?? null,
              quantity: item.quantity,
              combo_id: item.comboId ?? null,
              combo_group_id: item.comboGroupId ?? null,
              customization: item.selectedCustomization
                ? {
                    option_id: item.selectedCustomization.optionId,
                    text: item.selectedCustomization.text,
                    number: item.selectedCustomization.number,
                    flag_type: item.selectedCustomization.flagType,
                    flag_value: item.selectedCustomization.flagValue,
                  }
                : null,
            })),
            customer: {
              name,
              dni,
              phone,
              address,
              department,
              province,
              district,
              reference,
            },
          },
        },
      );

      if (error || !data?.ok) {
        throw new Error(
          data?.error ||
            error?.message ||
            "Culqi rechazó o no procesó el pago.",
        );
      }

      const charge = data.charge;
      const summary = data.summary;
      const canonicalItems = Array.isArray(data.items)
        ? data.items.map((serverItem: any) => {
            const original = cart.find((item) => {
              const sameProduct = String(item.id) === String(serverItem.product_id);
              const sameVariant = String(item.selectedVariant?.id ?? "") === String(serverItem.variant_id ?? "");
              const sameComboGroup = String(item.comboGroupId ?? "") === String(serverItem.combo_group_id ?? "");
              if (!sameProduct || !sameVariant || !sameComboGroup) return false;
              if (!serverItem.customization) return !item.selectedCustomization;
              return (
                String(item.selectedCustomization?.optionId ?? "") === String(serverItem.customization.option_id ?? "") &&
                String(item.selectedCustomization?.text ?? "") === String(serverItem.customization.text ?? "") &&
                String(item.selectedCustomization?.number ?? "") === String(serverItem.customization.number ?? "") &&
                String(item.selectedCustomization?.flagValue ?? "") === String(serverItem.customization.flag_value ?? "")
              );
            });

            return {
              ...(original || {}),
              id: serverItem.product_id,
              name: serverItem.product_name,
              price: Number(serverItem.unit_price),
              quantity: Number(serverItem.quantity),
              comboId: serverItem.combo_id || original?.comboId,
              comboGroupId: serverItem.combo_group_id || original?.comboGroupId,
              comboTitle: original?.comboTitle,
              selectedVariant: serverItem.variant_id
                ? {
                    ...(original?.selectedVariant || {}),
                    id: serverItem.variant_id,
                    type: serverItem.variant_type,
                    value: serverItem.variant_value,
                    colorName: serverItem.color_name || original?.selectedVariant?.colorName,
                    colorHex: serverItem.color_hex || original?.selectedVariant?.colorHex,
                  }
                : undefined,
              selectedCustomization: serverItem.customization
                ? {
                    ...(original?.selectedCustomization || {}),
                    optionId: serverItem.customization.option_id,
                    optionLabel: serverItem.customization.option_label,
                    price: Number(serverItem.customization.surcharge || 0),
                    text: serverItem.customization.text || "",
                    number: serverItem.customization.number || "",
                    flagType: serverItem.customization.flag_type || "country",
                    flagValue: serverItem.customization.flag_value || "",
                    key: original?.selectedCustomization?.key || `${serverItem.customization.option_id}|${serverItem.customization.text || ""}|${serverItem.customization.number || ""}|${serverItem.customization.flag_type || "country"}|${serverItem.customization.flag_value || ""}`,
                    summary: serverItem.customization.summary || serverItem.customization.option_label,
                  }
                : undefined,
            };
          })
        : cart;

      await registerOrder(
        {
          provider: "culqi",
          status: "paid",
          transactionId: charge?.id ?? null,
          reference: charge?.reference_code ?? null,
          cardBrand: charge?.source?.iin?.card_brand ?? null,
          installments: Number(charge?.installments ?? installments ?? 0),
          paidAt: charge?.date
            ? new Date(Number(charge.date)).toISOString()
            : new Date().toISOString(),
        },
        {
          subtotal: Number(summary?.subtotal ?? totalPrice),
          shippingCost: Number(summary?.shipping_cost ?? shippingCost),
          total: Number(summary?.total ?? finalTotal),
        },
        canonicalItems,
      );
    } catch (error: any) {
      setToast({
        type: "error",
        title: "Pago no realizado",
        message: error?.message || "No se pudo procesar el pago con Culqi.",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!validateCheckout()) return;

    const publicKey = import.meta.env.VITE_CULQI_PUBLIC_KEY;

    if (!publicKey) {
      setToast({
        type: "error",
        title: "Culqi no configurado",
        message: "Falta VITE_CULQI_PUBLIC_KEY en las variables del frontend.",
      });
      return;
    }

    if (!window.CulqiCheckout) {
      setToast({
        type: "warning",
        title: "Culqi cargando",
        message: "Espera unos segundos y vuelve a intentar.",
      });
      return;
    }

    const paymentMethods = {
      tarjeta: true,
      yape: false,
      billetera: false,
      bancaMovil: false,
      agente: false,
      cuotealo: false,
    };

    const config = {
      settings: {
        title: "The House of Sports",
        currency: "PEN",
        amount: Math.round(finalTotal * 100),
      },
      client: {
        email: user?.email || "",
      },
      options: {
        lang: "es",
        installments: true,
        modal: true,
        paymentMethods,
        paymentMethodsSort: ["tarjeta"],
      },
      appearance: {
        theme: "default",
        hiddenCulqiLogo: false,
        hiddenBannerContent: false,
        hiddenBanner: false,
        hiddenToolBarAmount: false,
        hiddenEmail: false,
        menuType: "sidebar",
        buttonCardPayText: "Pagar ahora",
        defaultStyle: {
          bannerColor: "#0a0a0a",
          buttonBackground: "#e3262e",
          menuColor: "#e3262e",
          linksColor: "#e3262e",
          buttonTextColor: "#ffffff",
          priceColor: "#e3262e",
        },
      },
    };

    const culqi = new window.CulqiCheckout(publicKey, config);
    culqiCheckoutRef.current = culqi;

    culqi.culqi = () => {
      if (culqi.token?.id) {
        const tokenId = culqi.token.id;

        // Culqi guarda la cantidad de cuotas seleccionada en metadata.installments.
        // Para pago sin cuotas normalmente será 0.
        const installments = Number(
          culqi.token?.metadata?.installments ?? 0,
        );

        culqi.close();
        setIsProcessingPayment(true);
        void payWithCulqi(tokenId, installments);
        return;
      }

      if (culqi.error) {
        setIsProcessingPayment(false);
        setToast({
          type: "error",
          title: "Pago no completado",
          message:
            culqi.error?.user_message ||
            culqi.error?.merchant_message ||
            culqi.error?.message ||
            "No se pudo generar el token de la tarjeta.",
        });
      }
    };

    culqi.open();
  };

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={() => {}} />
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] bg-white px-8 pb-8 pt-5 text-center shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:px-10 sm:pb-10">
            {/* Resplandor detrás del arquero */}
            <div className="pointer-events-none absolute left-1/2 top-[105px] h-[190px] w-[260px] -translate-x-1/2 rounded-full bg-[#e3262e]/15 blur-[55px]" />

            {/* Arquero */}
            <div className="relative mx-auto flex h-[270px] w-full items-center justify-center sm:h-[290px]">
              <img
                src={arqueroCarrito}
                alt="Arquero THS procesando pago"
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.18)]"
                draggable={false}
              />
            </div>

            {/* Texto */}
            <h3 className="-mt-2 text-[24px] font-black uppercase tracking-[-0.03em] text-neutral-950">
              Procesando pago
            </h3>

            <p className="mx-auto mt-2 max-w-[290px] text-sm font-medium leading-relaxed text-neutral-500">
              Estamos validando tu compra de forma segura...
            </p>

            {/* Barra de carga */}
            <div className="relative mt-7 h-[6px] w-full overflow-hidden rounded-full bg-neutral-200">
              <div className="absolute inset-y-0 left-0 w-[45%] animate-pulse rounded-full bg-[#e3262e]" />
            </div>

            {/* Texto inferior */}
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-400">
              No cierres esta ventana
            </p>
          </div>
        </div>
      )}
      <main className="padel-container py-12">
        <h1 className="text-4xl font-black uppercase text-neutral-950">
          Checkout
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
          <form className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-black">Datos de entrega</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl border p-4"
                placeholder="Nombre completo"
              />

              <input
                type="text"
                inputMode="numeric"
                value={dni}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  setDni(onlyNumbers.slice(0, 8));
                }}
                className="rounded-xl border p-4"
                placeholder="DNI"
                maxLength={8}
                autoComplete="off"
              />

              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const onlyNumbers = e.target.value.replace(/\D/g, "");
                  setPhone(onlyNumbers.slice(0, 9));
                }}
                className="rounded-xl border p-4"
                placeholder="Celular"
                maxLength={9}
              />

              <CustomSelect
                value={department}
                placeholder="Departamento"
                options={departments.map((item) => ({
                  value: item,
                  label: item,
                }))}
                onChange={setDepartment}
              />

              <CustomSelect
                value={province}
                placeholder="Provincia"
                options={provinces.map((item) => ({
                  value: item,
                  label: item,
                }))}
                onChange={setProvince}
                disabled={!department}
              />

              <CustomSelect
                value={district}
                placeholder="Distrito"
                options={districts.map((item) => ({
                  value: item.district,
                  label: item.district,
                }))}
                onChange={setDistrict}
                disabled={!province}
                className="md:col-span-2"
              />

              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="rounded-xl border p-4 md:col-span-2"
                placeholder="Dirección / domicilio"
                minLength={8}
              />

              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="rounded-xl border p-4"
                placeholder="Referencia"
              />
            </div>

            <h2 className="mt-8 text-xl font-black">Comprobante electrónico</h2>
            <p className="mt-1 text-sm text-neutral-500">
              El comprobante se emitirá automáticamente después de que Culqi confirme el pago.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-4 transition ${receiptType === "boleta" ? "border-[#e3262e] bg-orange-50" : "border-neutral-200"}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="receipt"
                    value="boleta"
                    checked={receiptType === "boleta"}
                    onChange={() => setReceiptType("boleta")}
                  />
                  <div>
                    <p className="font-black text-neutral-950">Boleta</p>
                    <p className="text-xs text-neutral-500">Se emitirá con tu DNI y nombre.</p>
                  </div>
                </div>
              </label>

              <label className={`cursor-pointer rounded-xl border p-4 transition ${receiptType === "factura" ? "border-[#e3262e] bg-orange-50" : "border-neutral-200"}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="receipt"
                    value="factura"
                    checked={receiptType === "factura"}
                    onChange={() => setReceiptType("factura")}
                  />
                  <div>
                    <p className="font-black text-neutral-950">Factura</p>
                    <p className="text-xs text-neutral-500">Requiere RUC y razón social.</p>
                  </div>
                </div>
              </label>
            </div>

            {receiptType === "factura" && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={invoiceRuc}
                  onChange={(e) => setInvoiceRuc(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  className="rounded-xl border p-4"
                  placeholder="RUC (11 dígitos)"
                  maxLength={11}
                />
                <input
                  value={invoiceBusinessName}
                  onChange={(e) => setInvoiceBusinessName(e.target.value)}
                  className="rounded-xl border p-4"
                  placeholder="Razón social"
                />
                <input
                  value={invoiceFiscalAddress}
                  onChange={(e) => setInvoiceFiscalAddress(e.target.value)}
                  className="rounded-xl border p-4 md:col-span-2"
                  placeholder="Dirección fiscal"
                />
              </div>
            )}

            <h2 className="mt-8 text-xl font-black">Método de pago</h2>

            <div className="mt-4 grid gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-4">
                <input
                  type="radio"
                  name="payment"
                  value="tarjeta"
                  checked
                  readOnly
                />
                <CreditCard size={20} />
                Tarjeta (Crédito / Débito)
              </label>
            </div>

            <button
              type="button"
              className="mt-8 w-full rounded-xl bg-[#e3262e] px-5 py-4 text-sm font-black uppercase text-white"
              onClick={handleCreateOrder}
              disabled={isProcessingPayment}
            >
              {isProcessingPayment ? "Procesando..." : "Pagar con tarjeta"}
            </button>
          </form>

          <aside className="rounded-2xl border border-neutral-200 p-6">
            <h2 className="text-xl font-black">Resumen</h2>

            <div className="mt-5 space-y-4">
              {cart.map((item) => {
                return (
                  <div
                    key={`${item.id}-${item.selectedVariant?.id || "simple"}-${item.selectedCustomization?.key || "normal"}-${item.comboGroupId || "normal-sale"}`}
                    className="rounded-xl border border-neutral-200 p-3"
                  >
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-contain"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black">{item.name}</p>
                        {item.comboTitle && <p className="mt-1 text-[10px] font-black uppercase text-[#e3262e]">Combo: {item.comboTitle}</p>}

                        {item.selectedVariant && (
                          <p className="mt-1 text-sm text-neutral-500">
                            {item.selectedVariant.colorName ? `${item.selectedVariant.colorName} · ` : ""}
                            {item.selectedVariant.type === "shoe_size" ? "Número" : "Talla"}: {item.selectedVariant.value}
                          </p>
                        )}
                        {item.selectedCustomization && (
                          <p className="mt-1 text-xs font-semibold text-fuchsia-600">
                            {item.selectedCustomization.summary}
                          </p>
                        )}

                        <strong className="mt-1 block text-sm">
                          S/{" "}
                          {(item.price * item.quantity).toLocaleString("es-PE")}
                        </strong>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.id, item.selectedVariant?.id, item.selectedCustomization?.key, item.comboGroupId)
                        }
                        className="self-start text-neutral-400 transition hover:text-[#e3262e]"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-500">
                        Cantidad
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.selectedVariant?.id,
                              item.quantity - 1,
                              item.selectedCustomization?.key,
                              item.comboGroupId,
                            )
                          }
                          disabled={Boolean(item.comboGroupId)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition hover:border-[#e3262e] hover:text-[#e3262e] disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Restar cantidad"
                        >
                          <Minus size={14} />
                        </button>

                        <span className="min-w-6 text-center text-sm font-black">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.selectedVariant?.id,
                              item.quantity + 1,
                              item.selectedCustomization?.key,
                              item.comboGroupId,
                            )
                          }
                          disabled={Boolean(item.comboGroupId) || getRemainingStock(item.id, item.selectedVariant?.id, item.selectedVariant?.stock ?? item.stock) <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition hover:border-[#e3262e] hover:text-[#e3262e] disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Sumar cantidad"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 space-y-3 border-t pt-5">
              <div className="flex justify-between">
                <span className="font-bold">Subtotal</span>
                <strong>S/ {totalPrice.toLocaleString("es-PE")}</strong>
              </div>

              <div className="flex justify-between">
                <span className="font-bold">Envío</span>
                <strong>{totalPrice >= 400 ? "GRATIS" : `S/ ${shippingCost.toLocaleString("es-PE")}`}</strong>
              </div>

              {totalPrice < 400 ? <p className="text-xs font-semibold text-green-700">Te faltan S/ {(400-totalPrice).toFixed(2)} para obtener envío gratis.</p> : <p className="text-xs font-black uppercase text-green-700">Envío gratis aplicado por compra desde S/ 400.</p>}

              <div className="flex justify-between border-t pt-4">
                <span className="font-black">Total</span>
                <strong className="text-xl">
                  S/ {finalTotal.toLocaleString("es-PE")}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}