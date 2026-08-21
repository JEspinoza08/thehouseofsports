import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, Palette, ShoppingCart, Star, X } from "lucide-react";
import { Product } from "../data/products";
import { SelectedCustomization, SelectedVariant, useCart } from "../context/CartContext";
import Toast from "./Toast";

export type ConfiguredProductSelection = {
  product: Product;
  variant?: SelectedVariant;
  customization?: SelectedCustomization;
};

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onConfigured?: (selection: ConfiguredProductSelection) => void;
  actionLabel?: string;
}

type CustomizationDraft = {
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

export default function ProductModal({ product, onClose, onConfigured, actionLabel }: ProductModalProps) {
  const { addToCart, getRemainingStock } = useCart();
  const [selectedVariantId,setSelectedVariantId]=useState("");
  const [selectedColor,setSelectedColor]=useState("");
  const [activeImage,setActiveImage]=useState("");
  const [customOpen,setCustomOpen]=useState(false);
  const [sizeGuideOpen,setSizeGuideOpen]=useState(false);
  const [selectedOptionId,setSelectedOptionId]=useState("");
  const [customText,setCustomText]=useState("");
  const [customNumber,setCustomNumber]=useState("");
  const [flagType,setFlagType]=useState<"country"|"emoji">("country");
  const [flagValue,setFlagValue]=useState("");
  const [customization,setCustomization]=useState<CustomizationDraft | undefined>();
  const [toast,setToast]=useState<{type:"success"|"error"|"warning"|"info";title:string;message?:string}|null>(null);

  useEffect(()=>{
    if(!product) return;
    document.body.style.overflow="hidden";
    setSelectedVariantId(""); setSelectedColor(""); setActiveImage(product.image); setCustomization(undefined); setCustomOpen(false); setSizeGuideOpen(false); setSelectedOptionId(""); setCustomText(""); setCustomNumber(""); setFlagValue("");
    const esc=(e:KeyboardEvent)=>{if(e.key==="Escape") onClose()};
    window.addEventListener("keydown",esc);
    return()=>{document.body.style.overflow="";window.removeEventListener("keydown",esc)};
  },[product,onClose]);

  const availableVariants=useMemo(()=>product?.variants?.filter((v)=>v.isActive&&v.stock>0&&getRemainingStock(product.id,v.id,v.stock)>0)||[],[product,getRemainingStock]);
  const colors=useMemo(()=>{
    const map=new Map<string,{name:string;hex:string|null}>();
    availableVariants.forEach((v)=>{if(v.colorName){const key=v.colorName.trim().toLowerCase(); if(!map.has(key))map.set(key,{name:v.colorName,hex:v.colorHex||null})}});
    return [...map.values()];
  },[availableVariants]);
  const visibleVariants=selectedColor?availableVariants.filter((v)=>v.colorName?.trim().toLowerCase()===selectedColor.toLowerCase()):availableVariants;
  const selectedVariant=availableVariants.find((v)=>v.id===selectedVariantId);
  const needsVariant=Boolean(product?.hasVariants&&availableVariants.length);
  const remainingSimpleStock = product?.hasVariants ? Infinity : getRemainingStock(product.id, undefined, product?.stock);
  const hasStock=product?.hasVariants?availableVariants.length>0:remainingSimpleStock>0;
  const selectedOption=product?.customizationOptions?.find((o)=>o.id===selectedOptionId);
  const finalUnitPrice=(product?.price||0)+(customization?.price||0);
  const gallery=product ? (product.images?.length ? product.images.map((i)=>i.url) : [product.image]) : [];

  if(!product) return null;

  const applyCustomization=()=>{
    if(!selectedOption){setToast({type:"warning",title:"Selecciona una opción",message:"Elige el tipo de personalización que deseas."});return;}
    const isEitherTextOrNumber = selectedOption.label.toLowerCase().includes("y/o");
    if(isEitherTextOrNumber && !customText.trim() && !customNumber.trim()){setToast({type:"warning",title:"Falta la personalización",message:"Ingresa un nombre/texto o un número."});return;}
    if(!isEitherTextOrNumber && selectedOption.requiresText&&!customText.trim()){setToast({type:"warning",title:"Falta el nombre o texto",message:"Completa el texto de personalización."});return;}
    if(!isEitherTextOrNumber && selectedOption.requiresNumber&&!customNumber.trim()){setToast({type:"warning",title:"Falta el número",message:"Completa el número de personalización."});return;}
    if(selectedOption.requiresFlag&&!flagValue.trim()){setToast({type:"warning",title:"Falta bandera o emoji",message:"Ingresa el país o emoji que deseas."});return;}
    const parts=[customText.trim()&&`Texto: ${customText.trim()}`,customNumber.trim()&&`Número: ${customNumber.trim()}`,flagValue.trim()&&`${flagType==="country"?"País":"Emoji"}: ${flagValue.trim()}`].filter(Boolean);
    const key=[selectedOption.id,customText.trim(),customNumber.trim(),flagType,flagValue.trim()].join("|");
    setCustomization({optionId:selectedOption.id,optionLabel:selectedOption.label,price:selectedOption.price,text:customText.trim(),number:customNumber.trim(),flagType,flagValue:flagValue.trim(),key,summary:`${selectedOption.label}${parts.length?` · ${parts.join(" · ")}`:""}`});
    setCustomOpen(false);
  };

  const add=()=>{
    if(!hasStock) return;
    if(needsVariant&&!selectedVariant){setToast({type:"warning",title:"Selecciona una opción",message:product.category==="zapatillas"?"Elige tu número antes de agregar el producto al carrito.":"Elige tu talla antes de agregar el producto al carrito."});return;}
    const variant = selectedVariant?{id:selectedVariant.id,type:selectedVariant.variantType,value:selectedVariant.variantValue,stock:selectedVariant.stock,colorName:selectedVariant.colorName||undefined,colorHex:selectedVariant.colorHex||undefined}:undefined;
    if (onConfigured) {
      onConfigured({ product, variant, customization });
      onClose();
      return;
    }
    const added = addToCart({...product,price:finalUnitPrice}, variant, customization);
    if (!added) {
      setToast({type:"warning",title:"Stock no disponible",message:"Ya tienes en el carrito todas las unidades disponibles de esta talla o producto."});
      return;
    }
    onClose();
  };

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={onClose}>
    <div className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white text-neutral-950 shadow-2xl animate-scale-in" onClick={(e)=>e.stopPropagation()}>
      <button onClick={onClose} className="absolute right-4 top-4 z-30 grid h-10 w-10 place-items-center rounded-full bg-neutral-950 text-white"><X size={20}/></button>
      <div className="grid lg:grid-cols-2">
        <div className="bg-neutral-50 p-5 lg:p-10"><div className="grid gap-4 sm:grid-cols-[76px_1fr] sm:gap-5">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:block sm:space-y-3">{gallery.map((url,index)=><button key={`${url}-${index}`} type="button" onClick={()=>setActiveImage(url)} className={`shrink-0 rounded-lg border bg-white p-1.5 ${activeImage===url?"border-[#e3262e]":"border-neutral-200"}`}><img src={url} alt={`${product.name} ${index+1}`} className="h-16 w-16 object-contain"/></button>)}</div>
          <div className="order-1 grid min-h-[270px] place-items-center sm:order-2 sm:min-h-[420px]"><img src={activeImage||product.image} alt={product.name} className="max-h-[300px] w-full object-contain sm:max-h-[520px]"/></div>
        </div></div>
        <div className="bg-white p-6 text-neutral-950 lg:p-10">
          <span className="rounded bg-[#e3262e] px-2 py-1 text-[10px] font-black uppercase text-white">{product.label}</span>
          <h2 className="mt-4 text-3xl font-black text-neutral-950">{product.name}</h2>
          <div className="mt-3 flex items-center gap-1">{[0,1,2,3,4].map((i)=><Star key={i} size={16} className="fill-amber-400 text-amber-400"/>)}</div>
          <div className="mt-5 flex items-baseline gap-3"><strong className="text-3xl font-black">S/ {finalUnitPrice.toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>{product.originalPrice&&<span className="text-lg text-neutral-400 line-through">S/ {product.originalPrice.toLocaleString("es-PE")}</span>}</div>
          {customization&&<p className="mt-1 text-xs font-semibold text-fuchsia-600">Incluye personalización + S/ {customization.price.toFixed(2)}</p>}
          <div className="mt-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase ${hasStock?"bg-green-100 text-green-700":"bg-red-100 text-red-700"}`}>{hasStock?"Con stock":"Sin stock"}</span></div>
          <p className="mt-5 text-sm leading-relaxed text-neutral-600">{product.description}</p>
          <div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase text-neutral-950">Características</h3><ul className="space-y-2">{product.features.map((f)=><li key={f} className="flex gap-2 text-sm text-neutral-600"><Check size={16} className="mt-0.5 shrink-0 text-[#e3262e]"/>{f}</li>)}</ul></div>

          {colors.length>0&&<div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase text-neutral-950">Selecciona el color</h3><div className="flex flex-wrap gap-2">{colors.map((color)=><button key={color.name} type="button" onClick={()=>{setSelectedColor(color.name);setSelectedVariantId("")}} className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black ${selectedColor===color.name?"border-[#e3262e] bg-[#fff4f1] text-[#e3262e]":"border-neutral-200 bg-white text-neutral-800"}`}><span className="h-5 w-5 rounded-full border border-black/10" style={{backgroundColor:color.hex||"#ddd"}}/>{color.name}</button>)}</div></div>}

          {needsVariant&&<div className="mt-6"><h3 className="mb-3 text-sm font-black uppercase text-neutral-950">{product.category==="zapatillas"?"Selecciona tu número":"Selecciona tu talla"}</h3>{colors.length>0&&!selectedColor?<p className="text-sm text-neutral-500">Primero selecciona un color.</p>:<div className="flex flex-wrap gap-2">{visibleVariants.map((variant)=><button key={variant.id} type="button" onClick={()=>setSelectedVariantId(variant.id)} className={`rounded-xl border px-4 py-2 text-sm font-black ${selectedVariantId===variant.id?"border-[#e3262e] bg-[#e3262e] text-white":"border-neutral-200 bg-white text-neutral-700"}`}>{variant.variantValue} <span className="ml-1 text-[10px] opacity-70">({getRemainingStock(product.id, variant.id, variant.stock)} disp.)</span></button>)}</div>}</div>}

          {product.sizeGuideUrl&&<button type="button" onClick={()=>setSizeGuideOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-black uppercase text-neutral-800 transition hover:border-[#e3262e] hover:text-[#e3262e]">Ver guía de tallas</button>}

          {product.personalizationEnabled&&Boolean(product.customizationOptions?.length)&&<div className="mt-6 rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-fuchsia-100 text-fuchsia-600"><Palette size={20}/></span><div><p className="font-black text-neutral-950">Personalízalo a tu gusto</p><p className="text-xs text-neutral-500">{customization?customization.summary:`Desde S/ ${Math.min(...(product.customizationOptions||[]).map((o)=>o.price)).toFixed(2)}`}</p></div></div><button type="button" onClick={()=>setCustomOpen(true)} className="rounded-full bg-fuchsia-600 px-4 py-2 text-xs font-black text-white">{customization?"Cambiar":"Añadir"}</button></div>{customization&&<button type="button" onClick={()=>setCustomization(undefined)} className="mt-3 text-xs font-bold text-neutral-500 underline">Quitar personalización</button>}</div>}

          <div className="mt-8"><button type="button" disabled={!hasStock} onClick={add} className={`padel-btn w-full gap-2 ${!hasStock?"cursor-not-allowed opacity-50":""}`}><ShoppingCart size={18}/>{hasStock?(actionLabel || (onConfigured ? "Guardar selección" : "Agregar al carrito")):"Sin stock"}</button></div>
        </div>
      </div>

      {sizeGuideOpen&&product.sizeGuideUrl&&<div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/75 p-4" onClick={()=>setSizeGuideOpen(false)}><div className="relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-4 shadow-2xl" onClick={(e)=>e.stopPropagation()}><button type="button" onClick={()=>setSizeGuideOpen(false)} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-neutral-950 text-white"><X size={20}/></button><div className="mb-3 pr-12"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#e3262e]">Encuentra tu medida</p><h3 className="text-2xl font-black uppercase">Guía de tallas</h3></div><img src={product.sizeGuideUrl} alt={`Guía de tallas de ${product.name}`} className="mx-auto max-h-[76vh] w-full object-contain"/></div></div>}

      {customOpen&&<div className="fixed inset-0 z-[140] bg-black/55" onClick={()=>setCustomOpen(false)}><aside className="ml-auto h-full w-full max-w-lg overflow-y-auto bg-white p-6 text-neutral-950 shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <div className="flex items-start justify-between"><div><p className="text-sm uppercase tracking-wide text-neutral-500">Personalización</p><h3 className="text-3xl font-black text-neutral-950">A TU GUSTO</h3></div><button onClick={()=>setCustomOpen(false)} className="text-neutral-950"><X size={24}/></button></div>
        {selectedOptionId&&<button type="button" onClick={()=>setSelectedOptionId("")} className="mt-8 inline-flex items-center gap-1 text-sm text-neutral-500"><ChevronLeft size={16}/>Cambiar personalización</button>}
        {!selectedOptionId?<div className="mt-8 space-y-3">{product.customizationOptions?.map((option)=><button key={option.id} type="button" onClick={()=>setSelectedOptionId(option.id)} className="flex w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-4 text-left text-neutral-950 transition hover:border-fuchsia-500"><span><strong className="block">{option.label}</strong>{option.description&&<span className="mt-1 block text-xs text-neutral-500">{option.description}</span>}</span><strong className="text-sm">+ S/ {option.price.toFixed(2)}</strong></button>)}</div>:selectedOption&&<div className="mt-5"><div className="rounded-2xl bg-neutral-50 p-5 text-center"><Palette className="mx-auto text-fuchsia-600" size={34}/><h4 className="mt-3 text-xl font-black">{selectedOption.label}</h4><p className="mt-1">(+ S/ {selectedOption.price.toFixed(2)})</p></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
          {selectedOption.requiresText&&<label className="text-xs font-bold">Texto / nombre<input value={customText} onChange={(e)=>setCustomText(e.target.value.slice(0,20))} maxLength={20} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-950 placeholder:text-neutral-400" placeholder="Ej: JOSE"/></label>}
          {selectedOption.requiresNumber&&<label className="text-xs font-bold">Número<input value={customNumber} onChange={(e)=>setCustomNumber(e.target.value.replace(/[^0-9]/g,"").slice(0,3))} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-950 placeholder:text-neutral-400" placeholder="Ej: 1"/></label>}
          {selectedOption.requiresFlag&&<><label className="text-xs font-bold">Tipo<select value={flagType} onChange={(e)=>setFlagType(e.target.value as "country"|"emoji")} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-950 placeholder:text-neutral-400"><option value="country">País / bandera</option><option value="emoji">Emoji</option></select></label><label className="text-xs font-bold">{flagType==="country"?"País":"Emoji"}<input value={flagValue} onChange={(e)=>setFlagValue(e.target.value.slice(0,30))} className="mt-1 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm font-normal text-neutral-950 placeholder:text-neutral-400" placeholder={flagType==="country"?"Ej: Perú":"Ej: 🧤"}/></label></>}
        </div><button type="button" onClick={applyCustomization} className="mt-8 w-full rounded-xl bg-neutral-950 px-4 py-4 text-sm font-black text-white">Aplicar personalización</button></div>}
      </aside></div>}
    </div>
    {toast&&<Toast type={toast.type} title={toast.title} message={toast.message} onClose={()=>setToast(null)}/>} 
  </div>;
}
