import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Download, Edit, LogOut, Package, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AdminProduct, ProductFormValues } from "../../lib/adminTypes";
import AdminProductForm from "./AdminProductForm";
import AdminNav from "../../components/AdminNav";
import { exportGroupedProductsToExcel } from "../../lib/exportExcel";

const emptyProduct: ProductFormValues = {
  sku_code: "",
  name: "",
  brand: "POKER",
  category: "guantes",
  price: 0,
  original_price: null,
  label: "Nuevo",
  image_url: "",
  description: "",
  features: [],
  recommended_for: "",
  level: ["Entrenamiento"],
  play_style: "Negativo",
  weight: null,
  is_offer: false,
  stock: 0,
  has_variants: false,
  product_variants: [],
  product_images: [],
  personalization_enabled: false,
  size_guide_url: null,
  filter_attributes: {},
  product_customization_options: [],
  is_active: true,
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProductFormValues | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string | number>>(new Set());

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("products")
      .select(
        `
  *,
  product_variants (*),
  product_images (*),
  product_customization_options (*)
`,
      )
      .order("updated_at", { ascending: false });

    if (error) setError(error.message);
    else setProducts((data || []) as AdminProduct[]);

    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.sku_code, p.name, p.brand, p.category, p.label].some((v) =>
        String(v).toLowerCase().includes(q),
      ),
    );
  }, [products, query]);

  const totalStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStock = products.filter((p) => Number(p.stock || 0) <= 3).length;



  const toggleProductExpanded = (productId: string | number) => {
    setExpandedProducts((current) => {
      const next = new Set(current);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const handleExportProducts = () => {
    exportGroupedProductsToExcel(
      filteredProducts,
      `ths-productos-${new Date().toISOString().slice(0, 10)}`,
      "Productos",
    );
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleSave = async (values: ProductFormValues) => {
    const variants = values.product_variants || [];

    const payload = {
      sku_code: String(values.sku_code || "").trim().toUpperCase(),
      name: values.name,
      brand: values.brand,
      category: values.category,
      price: values.price,
      original_price: values.original_price || null,
      label: values.label,
      image_url: values.image_url,
      description: values.description,
      features: values.features,
      recommended_for: values.recommended_for,
      level: values.level,
      play_style: values.play_style,
      weight: values.weight,
      stock: values.has_variants
        ? variants.reduce((sum, v) => sum + Number(v.stock || 0), 0)
        : values.stock,
      has_variants: values.has_variants,
      personalization_enabled: values.personalization_enabled,
      size_guide_url: values.size_guide_url || null,
      filter_attributes: values.filter_attributes || {},
      is_offer: Boolean(
        values.original_price && values.original_price > values.price,
      ),
      is_active: values.is_active,
      slug: slugify(values.name),
      updated_at: new Date().toISOString(),
    };

    let productId = values.id;

    if (values.id) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", values.id);

      if (error) {
        alert(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      productId = data.id;
    }

    if (productId) {
      await supabase
        .from("product_variants")
        .delete()
        .eq("product_id", productId);

      if (values.has_variants && variants.length > 0) {
        const cleanVariants = variants
          .filter((v) => v.variant_value.trim() !== "")
          .map((v) => ({
            product_id: productId,
            variant_type: v.variant_type,
            variant_value: v.variant_value,
            color_name: v.color_name?.trim() || null,
            color_hex: v.color_hex || null,
            stock: Number(v.stock || 0),
            is_active: v.is_active,
          }));

        if (cleanVariants.length > 0) {
          const { error } = await supabase
            .from("product_variants")
            .insert(cleanVariants);

          if (error) {
            alert(error.message);
            return;
          }
        }
      }
    }

    if (!productId) {
      alert("No se pudo identificar el producto guardado.");
      return;
    }

    await supabase.from("product_images").delete().eq("product_id", productId);
    const gallery = (values.product_images || [])
        .filter((img) => img.image_url.trim())
        .map((img, index) => ({
          product_id: productId,
          image_url: img.image_url,
          sort_order: index,
          is_primary: img.image_url === values.image_url,
        }));
    if (gallery.length > 0) {
        const { error: imagesError } = await supabase.from("product_images").insert(gallery);
        if (imagesError) {
          alert(imagesError.message);
          return;
        }
      }

    await supabase.from("product_customization_options").delete().eq("product_id", productId);
    if (values.personalization_enabled) {
        const customOptions = (values.product_customization_options || [])
          .filter((option) => option.label.trim())
          .map((option, index) => ({
            product_id: productId,
            label: option.label.trim(),
            description: option.description?.trim() || null,
            price: Number(option.price || 0),
            requires_text: option.requires_text,
            requires_number: option.requires_number,
            requires_flag: option.requires_flag,
            is_active: option.is_active,
            sort_order: index,
            updated_at: new Date().toISOString(),
          }));
        if (customOptions.length > 0) {
          const { error: customError } = await supabase.from("product_customization_options").insert(customOptions);
          if (customError) {
            alert(customError.message);
            return;
          }
        }
      }

    setEditing(null);
    await loadProducts();
  };

  const handleDelete = async (product: AdminProduct) => {
    const ok = confirm(`¿Eliminar ${product.name}?`);
    if (!ok) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id);
    if (error) alert(error.message);
    else await loadProducts();
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-8 xl:pl-[15.5rem]">
      <div className="max-w-7xl mx-auto">
        <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3262e]">
              The House of Sports
            </span>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">
              Gestión de productos
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Gestiona productos, precios, variantes, disponibilidad y stock.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportProducts}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              <Download size={16} />
              Exportar Excel
            </button>
            <button
              onClick={() => setEditing(emptyProduct)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#e3262e] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#d83f20]"
            >
              <Plus size={16} />
              Nuevo producto
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold transition hover:bg-white/10"
            >
              <LogOut size={16} />
              Salir
            </button>
          </div>
        </header>

        <AdminNav />

        <section className="mb-5 grid grid-cols-3 gap-2 md:gap-3">
          <div className="rounded-xl border border-white/10 bg-zinc-900 p-3 md:p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Productos
            </p>

            <p className="mt-1 text-xl font-black text-white md:text-2xl">
              {products.length}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-3 md:p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Stock total
            </p>

            <p className="mt-1 text-xl font-black text-white md:text-2xl">
              {totalStock}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-zinc-900 p-3 md:p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
              Stock bajo
            </p>

            <p
              className={`mt-1 text-xl font-black md:text-2xl ${
                lowStock > 0 ? "text-red-400" : "text-white"
              }`}
            >
              {lowStock}
            </p>
          </div>
        </section>

        <div className="relative mb-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código SKU, nombre, marca o categoría..."
            className="w-full rounded-xl border border-white/10 bg-zinc-900 py-2.5 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#e3262e]"
          />
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 p-4">
            {error}
          </div>
        )}

        <section className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Cargando productos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No hay productos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-3 py-3 text-left">Código SKU</th>
                    <th className="px-3 py-3 text-left">Variante</th>
                    <th className="px-3 py-3 text-left">Nombre</th>
                    <th className="px-3 py-3 text-left">Stock</th>
                    <th className="px-3 py-3 text-left">Precio</th>
                    <th className="px-3 py-3 text-left">Activo</th>
                    <th className="px-3 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.map((product) => {
                    const variants = product.has_variants && product.product_variants?.length
                      ? product.product_variants
                      : [];
                    const isExpanded = expandedProducts.has(product.id);

                    return (
                      <Fragment key={product.id}>
                        <tr className="transition hover:bg-white/[0.035]">
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs font-bold text-[#ff6268]">
                            {product.sku_code || "—"}
                          </td>
                          <td className="min-w-[170px] px-3 py-2.5 text-xs text-zinc-300">
                            {variants.length > 0 ? (
                              <button
                                type="button"
                                onClick={() => toggleProductExpanded(product.id)}
                                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 font-bold text-white transition hover:bg-white/5"
                              >
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                {variants.length} {variants.length === 1 ? "variante" : "variantes"}
                              </button>
                            ) : (
                              <span className="text-zinc-500">Sin variantes</span>
                            )}
                          </td>
                          <td className="min-w-[230px] px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-10 w-10 shrink-0 rounded-lg bg-white object-contain" />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800"><Package size={16} /></div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold leading-5 text-white" title={product.name}>{product.name}</p>
                                <p className="truncate text-[11px] capitalize text-gray-500">{product.brand} · {product.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-sm font-black ${Number(product.stock) <= 3 ? "text-red-400" : "text-emerald-400"}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-sm font-semibold text-white">S/{Number(product.price).toLocaleString("es-PE")}</td>
                          <td className="px-3 py-2.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${product.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-gray-500/10 text-gray-400"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${product.is_active ? "bg-emerald-400" : "bg-gray-500"}`} />
                              {product.is_active ? "Sí" : "No"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditing(product)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white" title="Editar"><Edit size={14} /></button>
                              <button onClick={() => handleDelete(product)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-300 transition hover:bg-red-500/20" title="Eliminar"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && variants.map((variant) => (
                          <tr key={variant.id} className="bg-black/20 text-xs">
                            <td className="px-3 py-2.5 font-mono text-[11px] text-zinc-600">↳ {product.sku_code || "—"}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex flex-col gap-0.5 pl-6">
                                <span className="font-bold text-zinc-200">{variant.variant_value}</span>
                                {variant.color_name && <span className="text-zinc-500">{variant.color_name}</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-zinc-500">Variante de {product.name}</td>
                            <td className="px-3 py-2.5">
                              <span className={`font-black ${Number(variant.stock) <= 3 ? "text-red-400" : "text-emerald-400"}`}>
                                {variant.stock}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-zinc-300">S/{Number(product.price).toLocaleString("es-PE")}</td>
                            <td className="px-3 py-2.5">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${variant.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-gray-500/10 text-gray-400"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${variant.is_active ? "bg-emerald-400" : "bg-gray-500"}`} />
                                {variant.is_active ? "Sí" : "No"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-[11px] text-zinc-600">—</td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editing && (
        <AdminProductForm
          product={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </main>
  );
}