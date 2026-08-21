import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, PackagePlus, ShoppingCart, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getProducts } from "../lib/productService";
import type { Product } from "../data/products";
import ProductModal, { ConfiguredProductSelection } from "./ProductModal";
import { useCart } from "../context/CartContext";
import Toast from "./Toast";

type ComboWithProducts = Record<string, any> & { products: Product[] };
type SelectionMap = Record<string, ConfiguredProductSelection>;

export default function ComboSection() {
  const { addComboToCart, getRemainingStock } = useCart();
  const [combos, setCombos] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<ComboWithProducts | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SelectionMap>>({});
  const [toast, setToast] = useState<{type:"success"|"error"|"warning"|"info";title:string;message?:string}|null>(null);

  useEffect(() => {
    supabase.from("product_combos").select("*").eq("is_active", true).order("sort_order").then(({ data }) => setCombos(data ?? []));
    getProducts().then(setProducts).catch(() => {});
  }, []);

  const byId = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  if (!combos.length) return null;

  const comboKey = selected ? String(selected.id) : "";
  const currentSelections = comboKey ? drafts[comboKey] || {} : {};
  const regularTotal = selected?.products.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0;
  const configuredBaseTotal = selected ? Number(selected.combo_price || regularTotal || 0) : 0;
  const customizationTotal = Object.values(currentSelections).reduce((sum, item) => sum + Number(item.customization?.price || 0), 0);
  const configuredTotal = configuredBaseTotal + customizationTotal;
  const allConfigured = Boolean(selected?.products.length) && selected!.products.every((p) => Boolean(currentSelections[String(p.id)]));

  const saveConfiguredProduct = (selection: ConfiguredProductSelection) => {
    if (!selected) return;
    setDrafts((prev) => ({
      ...prev,
      [String(selected.id)]: {
        ...(prev[String(selected.id)] || {}),
        [String(selection.product.id)]: selection,
      },
    }));
  };

  const addCombo = () => {
    if (!selected || !allConfigured || regularTotal <= 0) {
      setToast({ type: "warning", title: "Completa el combo", message: "Configura talla, color y personalización de cada producto antes de agregarlo." });
      return;
    }

    const comboGroupId = `${selected.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const baseComboPrice = Number(selected.combo_price || regularTotal);
    const discountFactor = baseComboPrice / regularTotal;

    const lines = selected.products.map((product) => {
      const configured = currentSelections[String(product.id)]!;
      const discountedProductPrice = Number(product.price || 0) * discountFactor;
      const finalLinePrice = discountedProductPrice + Number(configured.customization?.price || 0);
      return {
        product: { ...product, price: Number(finalLinePrice.toFixed(2)) },
        variant: configured.variant,
        customization: configured.customization,
      };
    });

    const unavailable = lines.find((line) =>
      getRemainingStock(
        line.product.id,
        line.variant?.id,
        line.variant?.stock ?? line.product.stock,
      ) <= 0,
    );
    if (unavailable) {
      setToast({
        type: "warning",
        title: "Stock agotado para este combo",
        message: `${unavailable.product.name} ya no tiene unidades disponibles con la selección elegida. Retíralo del carrito o elige otra talla/variante.`,
      });
      return;
    }

    const added = addComboToCart(lines, {
      comboId: String(selected.id),
      comboTitle: selected.title,
      comboGroupId,
    });
    if (!added) {
      setToast({
        type: "warning",
        title: "No hay stock suficiente",
        message: "Uno de los productos del combo ya está reservado en tu carrito. Revisa las cantidades antes de continuar.",
      });
      return;
    }

    setToast({ type: "success", title: "Combo agregado", message: `${selected.title} fue agregado al carrito con tus selecciones.` });
    setSelected(null);
  };

  return <section className="bg-[#090a0b] py-12 text-white lg:py-16"><div className="padel-container">
    <div className="mb-8 max-w-2xl"><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#e3262e]">Combina y juega mejor</p><h2 className="mt-2 text-3xl font-black uppercase italic tracking-[-.04em] lg:text-4xl">Combos THS</h2><p className="mt-3 text-sm leading-6 text-white/60">Combos creados por THS para que armes tu equipamiento más rápido y aproveches mejores combinaciones.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{combos.map((c) => {const ps=(Array.isArray(c.product_ids)?c.product_ids:[]).map((id:any)=>byId.get(String(id))).filter(Boolean) as Product[];const regular=ps.reduce((a,p)=>a+p.price,0);const price=Number(c.combo_price||regular||0);const saving=regular>price?Math.round((1-price/regular)*100):0;return <button key={c.id} onClick={()=>setSelected({...c,products:ps})} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#121416] text-left transition hover:-translate-y-1 hover:border-[#e3262e]/70">
      <div className="relative aspect-[4/3] overflow-hidden bg-black"><img src={c.image_url||ps[0]?.image} alt={c.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"/>{(c.badge||saving>0)&&<span className="absolute right-3 top-3 rounded bg-[#e3262e] px-2 py-1 text-[10px] font-black uppercase">{c.badge||`Ahorra ${saving}%`}</span>}</div>
      <div className="p-5"><h3 className="text-base font-black uppercase">{c.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/55">{c.description}</p>{price>0&&<p className="mt-4 text-lg font-black">S/ {price.toFixed(2)} {regular>price&&<span className="ml-2 text-xs font-medium text-white/35 line-through">S/ {regular.toFixed(2)}</span>}</p>}<span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase text-[#e3262e]">Ver combo <ArrowRight size={13}/></span></div>
    </button>})}</div>
  </div>

  {selected&&<div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4" onClick={()=>setSelected(null)}><div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111315] p-6" onClick={e=>e.stopPropagation()}>
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-[#e3262e]">Combo THS</p><h3 className="mt-1 text-2xl font-black uppercase">{selected.title}</h3><p className="mt-2 text-sm text-white/55">{selected.description}</p></div><button onClick={()=>setSelected(null)} className="rounded-full border border-white/10 p-2"><X/></button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2">{selected.products.map((p:Product)=>{const configured=currentSelections[String(p.id)];return <button key={p.id} type="button" onClick={()=>setEditingProduct(p)} className={`flex gap-3 rounded-xl border p-3 text-left transition ${configured?"border-green-500/50 bg-green-500/[.06]":"border-white/10 bg-white/[.03] hover:border-[#e3262e]/60"}`}><img src={p.image} className="h-20 w-20 rounded-lg bg-white object-contain"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-black uppercase text-[#e3262e]">{p.brand}</p><h4 className="mt-1 text-sm font-black">{p.name}</h4></div>{configured&&<CheckCircle2 size={18} className="shrink-0 text-green-400"/>}</div><p className="mt-2 text-sm font-black">Precio normal S/ {p.price.toFixed(2)}</p>{configured?<p className="mt-1 text-[11px] text-green-300">{configured.variant ? `${configured.variant.type === "shoe_size" ? "Número" : "Talla"}: ${configured.variant.value}` : "Producto configurado"}{configured.customization ? ` · ${configured.customization.summary}` : ""}</p>:<p className="mt-1 text-[11px] text-white/45">Haz clic para seleccionar talla, color y personalización.</p>}</div></button>})}</div>
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between text-sm"><span className="text-white/55">Precio normal de productos</span><span className={configuredBaseTotal<regularTotal?"line-through text-white/35":"font-bold"}>S/ {regularTotal.toFixed(2)}</span></div>{configuredBaseTotal<regularTotal&&<div className="mt-2 flex items-center justify-between text-sm"><span className="font-bold text-[#e3262e]">Precio combo</span><span className="font-black text-[#e3262e]">S/ {configuredBaseTotal.toFixed(2)}</span></div>}{customizationTotal>0&&<div className="mt-2 flex items-center justify-between text-sm"><span className="text-fuchsia-300">Personalizaciones</span><span className="font-bold text-fuchsia-300">+ S/ {customizationTotal.toFixed(2)}</span></div>}<div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3"><span className="font-black uppercase">Total del combo</span><span className="text-xl font-black">S/ {configuredTotal.toFixed(2)}</span></div></div>
    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-xs text-white/45"><PackagePlus size={15}/>Tus selecciones se mantienen mientras configuras cada producto.</div><button type="button" onClick={addCombo} disabled={!allConfigured} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e3262e] px-5 py-3 text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={17}/>Agregar combo al carrito</button></div>
  </div></div>}

  {editingProduct&&<ProductModal product={editingProduct} onClose={()=>setEditingProduct(null)} onConfigured={saveConfiguredProduct} actionLabel="Guardar para el combo"/>}
  {toast&&<Toast type={toast.type} title={toast.title} message={toast.message} onClose={()=>setToast(null)}/>} 
  </section>;
}
