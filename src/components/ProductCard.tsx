import { Eye } from "lucide-react";
import { Product } from "../data/products";

interface ProductCardProps {
  product: Product;
  onViewDetail: (product: Product) => void;
}

export default function ProductCard({ product, onViewDetail }: ProductCardProps) {
  const discount = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;
  const lowStock = typeof product.stock === "number" && product.stock > 0 && product.stock <= 3;

  return (
    <article className="group overflow-hidden rounded-[7px] border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-[0_18px_45px_rgba(0,0,0,0.09)]">
      <button onClick={() => onViewDetail(product)} className="relative block aspect-[0.96] w-full overflow-hidden bg-[#f6f6f6]">
        <img src={product.image} alt={product.name} className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-[1.06] sm:p-6" loading="lazy" />
        <div className="absolute left-3 top-3 flex max-w-[70%] flex-wrap gap-1.5">
          {product.label && <span className="rounded-[4px] bg-[#101113] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[0.04em] text-white">{product.label}</span>}
          {lowStock && <span className="rounded-[4px] bg-amber-500 px-2.5 py-1.5 text-[8px] font-black uppercase text-white">Acaba pronto</span>}
        </div>
        {discount && <span className="absolute right-3 top-3 rounded-[4px] bg-[#e3262e] px-2.5 py-1.5 text-[9px] font-black text-white">Ahorra {discount}%</span>}
        <span className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-2 place-items-center rounded-full bg-white text-neutral-950 opacity-0 shadow-md transition group-hover:translate-y-0 group-hover:opacity-100"><Eye size={17} /></span>
      </button>
      <div className="border-t border-neutral-100 p-3.5 sm:p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#e3262e]">{product.brand}</p>
        <button onClick={() => onViewDetail(product)} className="mt-1.5 min-h-[39px] text-left text-[11px] font-bold leading-snug text-neutral-900 transition hover:text-[#e3262e] sm:text-[13px]">{product.name}</button>
        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <strong className="text-[15px] font-black text-neutral-950 sm:text-[17px]">S/ {product.price.toLocaleString("es-PE")}</strong>
          {product.originalPrice && <span className="text-[10px] font-semibold text-neutral-400 line-through">S/ {product.originalPrice.toLocaleString("es-PE")}</span>}
        </div>
      </div>
    </article>
  );
}
