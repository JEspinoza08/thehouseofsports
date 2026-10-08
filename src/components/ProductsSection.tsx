import { SlidersHorizontal, X } from "lucide-react";
import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import { Product, Category } from "../data/products";
import { getProducts } from "../lib/productService";
import ProductCard from "./ProductCard";

interface ProductsSectionProps {
  onViewDetail: (product: Product) => void;
  initialCategory?: Category | null;
  searchQuery?: string;
  selectedBrand?: string;
  offersOnly?: boolean;
}

const allCategories: { id: Category; label: string }[] = [
  { id: "guantes", label: "Guantes" },
  { id: "zapatillas", label: "Zapatillas" },
  { id: "protecciones", label: "Protecciones" },
  { id: "accesorios", label: "Accesorios" },
  { id: "ropa", label: "Ropa" },
];

const filterMeta: Record<string, { key: string; label: string }> = {
  guantes: { key: "latex_type", label: "Tipo de látex" },
  zapatillas: { key: "sole_type", label: "Tipo de suela" },
  accesorios: { key: "protection_model", label: "Tipo de modelo" },
  protecciones: { key: "protection_model", label: "Tipo de modelo" },
};

export default function ProductsSection({
  onViewDetail,
  initialCategory,
  searchQuery,
  selectedBrand,
  offersOnly = false,
}: ProductsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(initialCategory || null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<string[]>([]);
  const [offersFilter, setOffersFilter] = useState(offersOnly);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const INITIAL_VISIBLE = 8;

  useEffect(() => {
    let mounted = true;
    setLoadingProducts(true);
    getProducts()
      .then((data) => mounted && setProducts(data))
      .catch((error) => {
        console.error("Error cargando productos:", error);
        if (mounted) setProducts([]);
      })
      .finally(() => mounted && setLoadingProducts(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setSelectedBrands(selectedBrand ? [selectedBrand] : []);
  }, [selectedBrand]);

  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => setOffersFilter(offersOnly), [offersOnly]);
  useEffect(() => setSelectedAttributeValues([]), [selectedCategory]);

  const availableBrands = useMemo(() =>
    Array.from(new Set(products.map((p) => p.brand?.trim()).filter((b): b is string => Boolean(b))))
      .sort((a, b) => a.localeCompare(b, "es")), [products]);

  const activeAttribute = selectedCategory ? filterMeta[selectedCategory] : undefined;
  const availableAttributeValues = useMemo(() => {
    if (!activeAttribute) return [];
    return Array.from(new Set(
      products
        .filter((p) => p.category === selectedCategory)
        .map((p) => p.filterAttributes?.[activeAttribute.key]?.trim())
        .filter((v): v is string => Boolean(v)),
    )).sort((a, b) => a.localeCompare(b, "es"));
  }, [products, selectedCategory, activeAttribute]);

  const filtered = useMemo(() => {
    const result = products.filter((p) => {
      if (offersFilter && !p.isOffer) return false;
      if (selectedCategory && p.category !== selectedCategory) return false;
      if (selectedBrands.length && !selectedBrands.some((b) => b.trim().toLowerCase() === p.brand.trim().toLowerCase())) return false;
      if (activeAttribute && selectedAttributeValues.length) {
        const value = p.filterAttributes?.[activeAttribute.key]?.trim();
        if (!value || !selectedAttributeValues.includes(value)) return false;
      }
      if (searchQuery?.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      }
      return true;
    });

    if (!selectedCategory) return result;
    return [...result].sort((a, b) => {
      const priority = ["POKER", "TLSS", "181 KEEPERS", "181KEEPERS"];
      const ai = priority.indexOf(a.brand.trim().toUpperCase());
      const bi = priority.indexOf(b.brand.trim().toUpperCase());
      if (ai !== -1 && bi === -1) return -1;
      if (ai === -1 && bi !== -1) return 1;
      if (ai !== -1 && bi !== -1) return ai - bi;
      return 0;
    });
  }, [products, offersFilter, selectedCategory, selectedBrands, activeAttribute, selectedAttributeValues, searchQuery]);

  const visibleProducts = showAllProducts ? filtered : filtered.slice(0, INITIAL_VISIBLE);

  useEffect(() => {
    setShowAllProducts(false);
  }, [selectedCategory, selectedBrands, selectedAttributeValues, searchQuery, selectedBrand, offersFilter]);

  const toggle = (value: string, setter: Dispatch<SetStateAction<string[]>>) =>
    setter((current) => current.includes(value) ? current.filter((x) => x !== value) : [...current, value]);

  const resetFilters = () => {
    setSelectedCategory(initialCategory || null);
    setSelectedBrands(selectedBrand ? [selectedBrand] : []);
    setSelectedAttributeValues([]);
    setOffersFilter(offersOnly);
  };

  const FilterPanel = () => (
    <aside className="space-y-7">
      <div>
        <h4 className="mb-3 text-xs font-black uppercase text-neutral-950">Categorías</h4>
        <div className="space-y-1">
          <button onClick={() => { setSelectedCategory(null); setOffersFilter(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${selectedCategory === null && !offersFilter ? "bg-[#e3262e] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>Todas las categorías</button>
          {allCategories.map((c) => (
            <button key={c.id} onClick={() => { setSelectedCategory(c.id); setOffersFilter(false); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${selectedCategory === c.id && !offersFilter ? "bg-[#e3262e] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>{c.label}</button>
          ))}
          <button onClick={() => { setSelectedCategory(null); setOffersFilter(true); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${offersFilter ? "bg-[#e3262e] text-white" : "text-neutral-600 hover:bg-neutral-50"}`}>Ofertas</button>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-black uppercase text-neutral-950">Marcas</h4>
        <div className="space-y-2">
          {availableBrands.length ? availableBrands.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-600">
              <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggle(brand, setSelectedBrands)} className="accent-[#e3262e]" />
              {brand}
            </label>
          )) : <p className="text-sm text-neutral-400">No hay marcas disponibles.</p>}
        </div>
      </div>

      {activeAttribute && availableAttributeValues.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-black uppercase text-neutral-950">{activeAttribute.label}</h4>
          <div className="space-y-2">
            {availableAttributeValues.map((value) => (
              <label key={value} className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-neutral-600">
                <input type="checkbox" checked={selectedAttributeValues.includes(value)} onChange={() => toggle(value, setSelectedAttributeValues)} className="accent-[#e3262e]" />
                {value}
              </label>
            ))}
          </div>
        </div>
      )}

      <button onClick={resetFilters} className="w-full rounded-md border border-neutral-200 py-2 text-xs font-black uppercase hover:border-[#e3262e] hover:text-[#e3262e]">Limpiar filtros</button>
    </aside>
  );

  return (
    <section id="productos" className="bg-[#f5f5f5] py-12 lg:py-16">
      <div className="padel-container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.14em] text-[#e3262e]">Selección THS</p>
            <h2 className="mt-2 text-[27px] font-black uppercase italic tracking-[-0.04em] lg:text-[35px]">{offersOnly ? "Ofertas especiales" : "Equípate con THS"}</h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-500">{offersOnly ? "Encuentra oportunidades y productos seleccionados a precio especial." : "Encuentra todo lo que necesitas para llevar tu juego al siguiente nivel."}</p>
          </div>
          <button onClick={() => setShowFilters(true)} className="flex items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-4 py-3 text-xs font-black uppercase lg:hidden"><SlidersHorizontal size={16} /> Filtros</button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
          <div className="hidden rounded-[8px] border border-neutral-200 bg-white p-5 lg:block"><FilterPanel /></div>
          <div>
            {loadingProducts ? <p className="py-10 text-center text-neutral-500">Cargando productos...</p> : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-neutral-500">No encontramos productos con esos filtros.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onViewDetail={onViewDetail} />)}
                </div>
                {filtered.length > INITIAL_VISIBLE && <div className="mt-8 flex justify-center"><button onClick={() => setShowAllProducts((v) => !v)} className="rounded-[4px] bg-[#e3262e] px-7 py-3 text-xs font-black uppercase text-white transition hover:bg-[#bd1720]">{showAllProducts ? "Mostrar menos productos" : "Mostrar más productos"}</button></div>}
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && <div className="fixed inset-0 z-[80] bg-black/50 lg:hidden"><div className="ml-auto h-full w-80 max-w-full overflow-y-auto bg-white p-5"><div className="mb-6 flex items-center justify-between"><h3 className="font-black uppercase">Filtros</h3><button onClick={() => setShowFilters(false)}><X /></button></div><FilterPanel /></div></div>}
    </section>
  );
}
