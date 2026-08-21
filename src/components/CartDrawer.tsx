import { X, Trash2, CreditCard, Minus, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
  cart,
  removeFromCart,
  updateQuantity,
  clearCart,
  totalPrice,
  getRemainingStock,
} = useCart();
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/50" onClick={onClose}>
      <aside
        className="ml-auto h-full w-full max-w-md bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-black">Mi carrito</h2>

          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="max-h-[calc(100vh-190px)] overflow-y-auto p-5">
          {cart.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Tu carrito está vacío.
            </p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
  <div
    key={`${item.id}-${item.selectedVariant?.id || "simple"}-${item.selectedCustomization?.key || "normal"}-${item.comboGroupId || "normal-sale"}`}
                  className="flex gap-4 rounded-xl border border-neutral-200 p-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-contain"
                  />

                  <div className="flex-1">
                    <h3 className="text-sm font-black">{item.name}</h3>{item.comboTitle && <p className="mt-1 text-[10px] font-black uppercase text-[#e3262e]">Combo: {item.comboTitle}</p>}
                    <div className="mt-3 flex items-center gap-3">
  <button
    type="button"
    onClick={() =>
      updateQuantity(
        item.id,
        item.selectedVariant?.id,
        item.quantity - 1,
        item.selectedCustomization?.key,
        item.comboGroupId
      )
    }
    disabled={Boolean(item.comboGroupId)}
    className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition hover:border-[#e3262e] hover:text-[#e3262e] disabled:cursor-not-allowed disabled:opacity-30"
    aria-label="Restar cantidad"
  >
    <Minus size={15} />
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
        item.comboGroupId
      )
    }
    disabled={Boolean(item.comboGroupId) || getRemainingStock(item.id, item.selectedVariant?.id, item.selectedVariant?.stock ?? item.stock) <= 0}
    className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 transition hover:border-[#e3262e] hover:text-[#e3262e] disabled:cursor-not-allowed disabled:opacity-30"
    aria-label="Sumar cantidad"
  >
    <Plus size={15} />
  </button>
</div>
                    {item.selectedVariant && (
  <p className="text-sm text-neutral-500">
    {item.selectedVariant.colorName ? `${item.selectedVariant.colorName} · ` : ""}
    {item.selectedVariant.type === "shoe_size" ? "Número" : "Talla"}: {item.selectedVariant.value}
  </p>
)}
                    {item.selectedCustomization && (
                      <p className="mt-1 text-xs font-semibold text-fuchsia-600">
                        {item.selectedCustomization.summary}
                      </p>
                    )}

                    <strong className="mt-2 block text-sm">
                      S/ {(item.price * item.quantity).toLocaleString("es-PE")}
                    </strong>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.id, item.selectedVariant?.id, item.selectedCustomization?.key, item.comboGroupId)}
                    className="text-neutral-400 hover:text-[#e3262e]"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t p-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold">Total</span>
              <strong className="text-xl">
                S/ {totalPrice.toLocaleString("es-PE")}
              </strong>
            </div>

            {totalPrice >= 400 ? <p className="mb-3 text-xs font-black uppercase text-green-700">Envío gratis aplicado desde S/ 400</p> : <p className="mb-3 text-xs font-semibold text-neutral-500">Te faltan S/ {(400-totalPrice).toFixed(2)} para envío gratis.</p>}

            <div className="grid gap-3">
              <button
  onClick={() => {
    onClose();
    navigate("/checkout");
  }}
  className="flex items-center justify-center gap-2 rounded-xl bg-[#e3262e] px-4 py-3 text-sm font-black uppercase text-white"
>
  <CreditCard size={18} />
  Finalizar pedido
</button>

              <button
                onClick={clearCart}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-black uppercase"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}