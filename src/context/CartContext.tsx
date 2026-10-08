import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "../data/products";

export type SelectedVariant = {
  id: string;
  type: string;
  value: string;
  stock?: number;
  colorName?: string;
  colorHex?: string;
};

export type SelectedCustomization = {
  optionId: string;
  optionLabel: string;
  price: number;
  text: string;
  number: string;
  flagType: "country" | "emoji";
  flagValue: string;
  key: string;
  summary: string;
};

export type CartItem = Product & {
  quantity: number;
  selectedVariant?: SelectedVariant;
  selectedCustomization?: SelectedCustomization;
  comboId?: string;
  comboTitle?: string;
  comboGroupId?: string;
};

export type ComboCartLine = {
  product: Product;
  variant?: SelectedVariant;
  customization?: SelectedCustomization;
};

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, variant?: SelectedVariant, customization?: SelectedCustomization, comboMeta?: { comboId: string; comboTitle: string; comboGroupId: string }) => boolean;
  addComboToCart: (lines: ComboCartLine[], comboMeta: { comboId: string; comboTitle: string; comboGroupId: string }) => boolean;
  removeFromCart: (productId: string | number, variantId?: string, customizationKey?: string, comboGroupId?: string) => void;
  updateQuantity: (productId: string | number, variantId: string | undefined, quantity: number, customizationKey?: string, comboGroupId?: string) => void;
  getReservedQuantity: (productId: string | number, variantId?: string) => number;
  getRemainingStock: (productId: string | number, variantId: string | undefined, stock: number | undefined) => number;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "ths-cart-v3";

const sameItem = (item: CartItem, productId: string | number, variantId?: string, customizationKey?: string, comboGroupId?: string) =>
  String(item.id) === String(productId) &&
  item.selectedVariant?.id === variantId &&
  item.selectedCustomization?.key === customizationKey &&
  item.comboGroupId === comboGroupId;

const stockKey = (productId: string | number, variantId?: string) => `${String(productId)}::${variantId || "simple"}`;
const lineStock = (item: CartItem) => item.selectedVariant?.stock ?? item.stock;

/**
 * Normaliza un carrito persistido para que nunca pueda contener más unidades
 * que el stock conocido. Los combos son atómicos: si una de sus piezas ya no
 * tiene disponibilidad, se elimina el combo completo en vez de dejarlo roto.
 */
function normalizePersistedCart(input: CartItem[]): CartItem[] {
  const result: CartItem[] = [];
  const used = new Map<string, number>();
  const handledGroups = new Set<string>();

  for (const item of input) {
    if (item.comboGroupId) {
      if (handledGroups.has(item.comboGroupId)) continue;
      handledGroups.add(item.comboGroupId);
      const group = input.filter((candidate) => candidate.comboGroupId === item.comboGroupId);
      const fits = group.every((line) => {
        const stock = lineStock(line);
        if (stock == null || !Number.isFinite(Number(stock))) return true;
        const key = stockKey(line.id, line.selectedVariant?.id);
        const remaining = Math.max(0, Number(stock) - (used.get(key) || 0));
        return line.quantity <= remaining;
      });
      if (!fits) continue;
      group.forEach((line) => {
        result.push(line);
        const stock = lineStock(line);
        if (stock != null && Number.isFinite(Number(stock))) {
          const key = stockKey(line.id, line.selectedVariant?.id);
          used.set(key, (used.get(key) || 0) + line.quantity);
        }
      });
      continue;
    }

    const stock = lineStock(item);
    if (stock == null || !Number.isFinite(Number(stock))) {
      result.push(item);
      continue;
    }
    const key = stockKey(item.id, item.selectedVariant?.id);
    const remaining = Math.max(0, Number(stock) - (used.get(key) || 0));
    if (remaining <= 0) continue;
    const quantity = Math.min(item.quantity, remaining);
    result.push({ ...item, quantity });
    used.set(key, (used.get(key) || 0) + quantity);
  }

  return result;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      // Migra el carrito anterior y sanea posibles sobreventas creadas por la versión previa.
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("ths-cart-v2");
      return raw ? normalizePersistedCart(JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      localStorage.removeItem("ths-cart-v2");
    } catch { /* storage unavailable */ }
  }, [cart]);

  const getReservedQuantityFrom = (source: CartItem[], productId: string | number, variantId?: string) =>
    source
      .filter((item) => String(item.id) === String(productId) && item.selectedVariant?.id === variantId)
      .reduce((sum, item) => sum + item.quantity, 0);

  const getReservedQuantity = (productId: string | number, variantId?: string) =>
    getReservedQuantityFrom(cart, productId, variantId);

  const getRemainingStock = (productId: string | number, variantId: string | undefined, stock: number | undefined) => {
    if (stock == null || !Number.isFinite(Number(stock))) return Infinity;
    return Math.max(0, Number(stock) - getReservedQuantity(productId, variantId));
  };

  const addToCart = (product: Product, variant?: SelectedVariant, customization?: SelectedCustomization, comboMeta?: { comboId: string; comboTitle: string; comboGroupId: string }) => {
    const availableStock = variant?.stock ?? product.stock;
    const reserved = getReservedQuantity(product.id, variant?.id);
    if (availableStock != null && reserved >= Number(availableStock)) return false;

    setCart((prev) => {
      const currentReserved = getReservedQuantityFrom(prev, product.id, variant?.id);
      if (availableStock != null && currentReserved >= Number(availableStock)) return prev;

      const groupId = comboMeta?.comboGroupId;
      const exists = prev.find((item) => sameItem(item, product.id, variant?.id, customization?.key, groupId));
      if (exists) {
        return prev.map((item) => sameItem(item, product.id, variant?.id, customization?.key, groupId)
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...prev, { ...product, selectedVariant: variant, selectedCustomization: customization, quantity: 1, ...comboMeta }];
    });

    window.setTimeout(() => window.dispatchEvent(new CustomEvent("cart:add-animation", { detail: { productId: product.id, category: product.category } })), 80);
    return true;
  };

  const addComboToCart = (lines: ComboCartLine[], comboMeta: { comboId: string; comboTitle: string; comboGroupId: string }) => {
    // Validación previa para feedback inmediato.
    const requested = new Map<string, number>();
    for (const line of lines) {
      const key = stockKey(line.product.id, line.variant?.id);
      requested.set(key, (requested.get(key) || 0) + 1);
      const stock = line.variant?.stock ?? line.product.stock;
      if (stock != null) {
        const reserved = getReservedQuantity(line.product.id, line.variant?.id);
        if (reserved + (requested.get(key) || 0) > Number(stock)) return false;
      }
    }

    setCart((prev) => {
      const localRequested = new Map<string, number>();
      for (const line of lines) {
        const key = stockKey(line.product.id, line.variant?.id);
        localRequested.set(key, (localRequested.get(key) || 0) + 1);
        const stock = line.variant?.stock ?? line.product.stock;
        if (stock != null) {
          const reserved = getReservedQuantityFrom(prev, line.product.id, line.variant?.id);
          if (reserved + (localRequested.get(key) || 0) > Number(stock)) return prev;
        }
      }
      return [
        ...prev,
        ...lines.map((line) => ({
          ...line.product,
          selectedVariant: line.variant,
          selectedCustomization: line.customization,
          quantity: 1,
          ...comboMeta,
        })),
      ];
    });

    lines.forEach((line) => window.setTimeout(() => window.dispatchEvent(new CustomEvent("cart:add-animation", { detail: { productId: line.product.id, category: line.product.category } })), 80));
    return true;
  };

  const removeFromCart = (productId: string | number, variantId?: string, customizationKey?: string, comboGroupId?: string) => {
    setCart((prev) => comboGroupId
      ? prev.filter((item) => item.comboGroupId !== comboGroupId)
      : prev.filter((item) => !sameItem(item, productId, variantId, customizationKey, comboGroupId)));
  };

  const updateQuantity = (productId: string | number, variantId: string | undefined, quantity: number, customizationKey?: string, comboGroupId?: string) => {
    setCart((prev) => {
      if (comboGroupId) return prev; // Los combos se venden como una unidad cerrada.
      if (quantity <= 0) return prev.filter((item) => !sameItem(item, productId, variantId, customizationKey, comboGroupId));

      const target = prev.find((item) => sameItem(item, productId, variantId, customizationKey, comboGroupId));
      if (!target) return prev;
      const stock = target.selectedVariant?.stock ?? target.stock;
      if (stock != null) {
        const reservedByOthers = prev
          .filter((item) => !sameItem(item, productId, variantId, customizationKey, comboGroupId))
          .filter((item) => String(item.id) === String(productId) && item.selectedVariant?.id === variantId)
          .reduce((sum, item) => sum + item.quantity, 0);
        quantity = Math.min(quantity, Math.max(0, Number(stock) - reservedByOthers));
      }
      if (quantity <= 0) return prev;
      return prev.map((item) => sameItem(item, productId, variantId, customizationKey, comboGroupId) ? { ...item, quantity } : item);
    });
  };

  const clearCart = () => setCart([]);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);
  const totalPrice = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);

  return <CartContext.Provider value={{ cart, addToCart, addComboToCart, removeFromCart, updateQuantity, getReservedQuantity, getRemainingStock, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}
