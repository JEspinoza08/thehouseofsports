import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Plus, Trash2, X } from "lucide-react";
import { ProductFormValues } from "../../lib/adminTypes";
import { supabase } from "../../lib/supabase";

type Props = {
  product: ProductFormValues;
  onClose: () => void;
  onSave: (values: ProductFormValues) => Promise<void>;
};

type Brand = { id: string; name: string; slug: string; logo_url: string | null; is_active: boolean };
type CategoryRow = { id: string; name: string; slug: string; is_active: boolean };

const labels = ["Nuevo", "Oferta", "Más vendido", "Recomendado"];
const levels = ["Entrenamiento", "Pre profesional", "Profesional"];
const styles = ["Negativo", "Roll Finger", "Híbrido", "Flat"];

const slugify = (text: string) =>
  text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function AdminProductForm({ product, onClose, onSave }: Props) {
  const [values, setValues] = useState<ProductFormValues>(product);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingGuide, setUploadingGuide] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newBrand, setNewBrand] = useState("");
  const [savingBrand, setSavingBrand] = useState(false);

  const featuresText = useMemo(() => values.features.join("\n"), [values.features]);

  const setField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      const [{ data: brandData }, { data: categoryData }] = await Promise.all([
        supabase.from("brands").select("id,name,slug,logo_url,is_active").eq("is_active", true).order("name"),
        supabase.from("categories").select("id,name,slug,is_active").eq("is_active", true).order("sort_order"),
      ]);
      setBrands((brandData || []) as Brand[]);
      setCategories((categoryData || []) as CategoryRow[]);
    };
    load().catch(console.error);
  }, []);

  const handleCreateBrand = async () => {
    const cleanName = newBrand.trim().toUpperCase();
    if (!cleanName) return;
    if (brands.some((brand) => brand.name.toLowerCase() === cleanName.toLowerCase())) {
      alert("Esta marca ya está registrada.");
      return;
    }
    setSavingBrand(true);
    const { data, error } = await supabase
      .from("brands")
      .insert({ name: cleanName, slug: slugify(cleanName), logo_url: null, is_active: true })
      .select("id,name,slug,logo_url,is_active")
      .single();
    setSavingBrand(false);
    if (error) {
      alert(error.message);
      return;
    }
    const created = data as Brand;
    setBrands((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "es")));
    setField("brand", created.name);
    setNewBrand("");
  };

  const handleImageUpload = async (files: FileList | File[]) => {
    const selected = Array.from(files);
    if (!selected.length) return;
    setUploading(true);
    const uploaded: { image_url: string; sort_order: number; is_primary: boolean }[] = [];

    for (const file of selected) {
      const ext = file.name.split(".").pop() || "webp";
      const fileName = `productos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("productos").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) {
        alert(error.message);
        continue;
      }
      const { data } = supabase.storage.from("productos").getPublicUrl(fileName);
      uploaded.push({
        image_url: data.publicUrl,
        sort_order: (values.product_images?.length || 0) + uploaded.length,
        is_primary: !values.image_url && uploaded.length === 0,
      });
    }

    if (uploaded.length) {
      setValues((prev) => {
        const nextImages = [...(prev.product_images || []), ...uploaded];
        const primary = prev.image_url || uploaded[0].image_url;
        return {
          ...prev,
          image_url: primary,
          product_images: nextImages.map((img, index) => ({ ...img, sort_order: index, is_primary: img.image_url === primary })),
        };
      });
    }
    setUploading(false);
  };


  const handleSizeGuideUpload = async (file: File) => {
    setUploadingGuide(true);
    try {
      const ext = file.name.split(".").pop() || "webp";
      const fileName = `guias-tallas/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("productos").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) { alert(error.message); return; }
      const { data } = supabase.storage.from("productos").getPublicUrl(fileName);
      setField("size_guide_url", data.publicUrl);
    } finally {
      setUploadingGuide(false);
    }
  };

  const setFilterAttribute = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      filter_attributes: { ...(prev.filter_attributes || {}), [key]: value },
    }));
  };

  const removeImage = (index: number) => {
    setValues((prev) => {
      const remaining = (prev.product_images || []).filter((_, i) => i !== index);
      const removed = prev.product_images?.[index]?.image_url;
      let primary = prev.image_url;
      if (removed === primary) primary = remaining[0]?.image_url || "";
      return {
        ...prev,
        image_url: primary,
        product_images: remaining.map((img, i) => ({ ...img, sort_order: i, is_primary: img.image_url === primary })),
      };
    });
  };

  const setPrimaryImage = (url: string) => {
    setValues((prev) => ({
      ...prev,
      image_url: url,
      product_images: (prev.product_images || []).map((img) => ({ ...img, is_primary: img.image_url === url })),
    }));
  };

  const addVariant = () => {
    setValues((prev) => ({
      ...prev,
      product_variants: [
        ...(prev.product_variants || []),
        {
          variant_type: prev.category === "zapatillas" ? "shoe_size" : "size",
          variant_value: "",
          color_name: "",
          color_hex: "",
          stock: 0,
          is_active: true,
        },
      ],
    }));
  };

  const updateVariant = (index: number, key: string, value: string | number | boolean | null) => {
    setValues((prev) => ({
      ...prev,
      product_variants: (prev.product_variants || []).map((variant, i) => (i === index ? { ...variant, [key]: value } : variant)),
    }));
  };

  const addCustomization = () => {
    setValues((prev) => ({
      ...prev,
      product_customization_options: [
        ...(prev.product_customization_options || []),
        {
          label: "Nombre y/o número",
          description: "Personalización del guante",
          price: 0,
          requires_text: true,
          requires_number: true,
          requires_flag: false,
          is_active: true,
          sort_order: prev.product_customization_options?.length || 0,
        },
      ],
    }));
  };

  const updateCustomization = (index: number, key: string, value: string | number | boolean | null) => {
    setValues((prev) => ({
      ...prev,
      product_customization_options: (prev.product_customization_options || []).map((option, i) => (i === index ? { ...option, [key]: value } : option)),
    }));
  };

  const toggleLevel = (level: string) => {
    setValues((prev) => ({
      ...prev,
      level: prev.level.includes(level) ? prev.level.filter((item) => item !== level) : [...prev.level, level],
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (values.has_variants && !(values.product_variants || []).some((v) => v.variant_value.trim())) {
      alert("Agrega al menos una talla/número cuando el producto usa variantes.");
      return;
    }
    if (values.personalization_enabled && !(values.product_customization_options || []).length) {
      alert("Agrega al menos una opción de personalización.");
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={handleSubmit} className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{values.id ? "Editar producto" : "Nuevo producto"}</h2>
            <p className="text-sm text-gray-400">Producto, galería, colores, tallas, stock y personalización.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg bg-white/5 p-2 text-white hover:bg-white/10"><X size={20} /></button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Código SKU"><input value={values.sku_code || ""} onChange={(e) => setField("sku_code", e.target.value.toUpperCase())} required placeholder="Ej: THS-GUA-001" className="input-admin font-mono uppercase" /></Field>
          <Field label="Nombre"><input value={values.name} onChange={(e) => setField("name", e.target.value)} required className="input-admin" /></Field>
          <Field label="Marca">
            <select value={values.brand} onChange={(e) => setField("brand", e.target.value)} className="input-admin" required>
              <option value="">Selecciona una marca</option>
              {brands.map((brand) => <option key={brand.id} value={brand.name}>{brand.name}</option>)}
            </select>
            <div className="mt-2 flex gap-2">
              <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="Nueva marca" className="input-admin" />
              <button type="button" onClick={handleCreateBrand} disabled={savingBrand || !newBrand.trim()} className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-white disabled:opacity-50">{savingBrand ? "..." : "Agregar"}</button>
            </div>
          </Field>
          <Field label="Categoría">
            <select value={values.category} onChange={(e) => setField("category", e.target.value)} className="input-admin capitalize" required>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-500">Las categorías se administran desde la sección “Categorías”.</p>
          </Field>
          <Field label="Etiqueta"><select value={values.label} onChange={(e) => setField("label", e.target.value)} className="input-admin">{labels.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Precio actual"><input type="number" min="0" step="0.01" value={values.price} onChange={(e) => setField("price", Number(e.target.value))} required className="input-admin" /></Field>
          <Field label="Precio anterior / tachado"><input type="number" min="0" step="0.01" value={values.original_price ?? ""} onChange={(e) => setField("original_price", e.target.value ? Number(e.target.value) : null)} className="input-admin" /></Field>
          {!values.has_variants && <Field label="Stock disponible"><input type="number" min="0" value={values.stock} onChange={(e) => setField("stock", Number(e.target.value))} required className="input-admin" /></Field>}
          <Field label="Tipo de corte"><select value={values.play_style} onChange={(e) => setField("play_style", e.target.value)} className="input-admin">{styles.map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="Peso"><select value={values.weight ?? ""} onChange={(e) => setField("weight", e.target.value || null)} className="input-admin"><option value="">No aplica</option><option value="Ligera">Ligera</option><option value="Pesada">Pesada</option></select></Field>
          {values.category === "guantes" && <Field label="Tipo de látex (filtro)"><input value={values.filter_attributes?.latex_type || ""} onChange={(e) => setFilterAttribute("latex_type", e.target.value)} placeholder="Ej: Contact Latex / Aqua / Soft" className="input-admin" /></Field>}
          {values.category === "zapatillas" && <Field label="Tipo de suela (filtro)"><input value={values.filter_attributes?.sole_type || ""} onChange={(e) => setFilterAttribute("sole_type", e.target.value)} placeholder="Ej: FG / TF / IC" className="input-admin" /></Field>}
          {values.category === "accesorios" && <Field label="Tipo de modelo (filtro)"><input value={values.filter_attributes?.protection_model || ""} onChange={(e) => setFilterAttribute("protection_model", e.target.value)} placeholder="Ej: Codera / Rodillera / Protección" className="input-admin" /></Field>}
        </div>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><p className="font-bold text-white">Galería de imágenes</p><p className="text-xs text-gray-400">Puedes subir varias imágenes. Marca una como principal.</p></div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"><ImagePlus size={17} />{uploading ? "Subiendo..." : "Subir imágenes"}<input type="file" multiple accept="image/*" disabled={uploading} className="hidden" onChange={(e) => e.target.files && handleImageUpload(e.target.files)} /></label>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {(values.product_images || []).map((img, index) => (
              <div key={`${img.image_url}-${index}`} className={`relative overflow-hidden rounded-xl border bg-white ${img.image_url === values.image_url ? "border-[#e3262e] ring-2 ring-[#e3262e]/30" : "border-white/10"}`}>
                <img src={img.image_url} alt="Producto" className="aspect-square w-full object-contain" />
                <div className="flex gap-1 bg-zinc-950 p-2">
                  <button type="button" onClick={() => setPrimaryImage(img.image_url)} className="flex-1 rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">{img.image_url === values.image_url ? "Principal" : "Hacer principal"}</button>
                  <button type="button" onClick={() => removeImage(index)} className="rounded bg-red-500/15 p-1.5 text-red-300"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-bold text-white">Guía de tallas</p><p className="text-xs text-gray-400">Sube una imagen específica para este producto. El cliente podrá abrirla desde el detalle.</p></div>
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10"><ImagePlus size={17} />{uploadingGuide ? "Subiendo..." : "Subir guía"}<input type="file" accept="image/*" disabled={uploadingGuide} className="hidden" onChange={(e) => e.target.files?.[0] && handleSizeGuideUpload(e.target.files[0])} /></label>
          </div>
          {values.size_guide_url && <div className="mt-4 flex items-start gap-3"><img src={values.size_guide_url} alt="Guía de tallas" className="h-36 w-36 rounded-xl bg-white object-contain"/><button type="button" onClick={() => setField("size_guide_url", null)} className="rounded-xl bg-red-500/10 p-3 text-red-300"><Trash2 size={18}/></button></div>}
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><p className="font-bold text-white">Variantes por color + talla/número</p><p className="text-xs text-gray-400">Cada fila es una combinación vendible con su propio stock. El color puede quedar vacío.</p></div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={values.has_variants} onChange={(e) => setField("has_variants", e.target.checked)} />Tiene variantes</label>
          </div>
          {values.has_variants && <div className="space-y-3">
            {(values.product_variants || []).map((variant, index) => (
              <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-zinc-950 p-3 md:grid-cols-[1.1fr_90px_1fr_1fr_100px_auto]">
                <input value={variant.color_name || ""} onChange={(e) => updateVariant(index, "color_name", e.target.value)} placeholder="Color ej. Negro" className="input-admin" />
                <input type="color" value={variant.color_hex || "#000000"} onChange={(e) => updateVariant(index, "color_hex", e.target.value)} className="h-[46px] w-full rounded-xl border border-white/10 bg-zinc-900 p-1" />
                <select value={variant.variant_type} onChange={(e) => updateVariant(index, "variant_type", e.target.value)} className="input-admin"><option value="size">Talla</option><option value="shoe_size">Número</option></select>
                <input value={variant.variant_value} onChange={(e) => updateVariant(index, "variant_value", e.target.value)} placeholder="Ej: 9 / M / 40" className="input-admin" />
                <input type="number" min="0" value={variant.stock} onChange={(e) => updateVariant(index, "stock", Number(e.target.value))} placeholder="Stock" className="input-admin" />
                <button type="button" onClick={() => setValues((prev) => ({ ...prev, product_variants: (prev.product_variants || []).filter((_, i) => i !== index) }))} className="rounded-xl bg-red-500/10 p-3 text-red-300"><Trash2 size={18} /></button>
              </div>
            ))}
            <button type="button" onClick={addVariant} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white"><Plus size={16} />Agregar combinación</button>
          </div>}
        </section>

        <section className="mb-6 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/[0.04] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><p className="font-bold text-white">Personalización del guante</p><p className="text-xs text-gray-400">Actívala solo en los productos que puedan llevar nombre, número, bandera o emoji.</p></div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={values.personalization_enabled} onChange={(e) => {
              const enabled = e.target.checked;
              setValues((prev) => ({
                ...prev,
                personalization_enabled: enabled,
                product_customization_options: enabled && !(prev.product_customization_options || []).length
                  ? [
                      { label: "Nombre y/o número", description: "Agrega tu nombre, texto o dorsal", price: 5.99, requires_text: true, requires_number: true, requires_flag: false, is_active: true, sort_order: 0 },
                      { label: "Nombre, número y bandera o emoji", description: "Personalización completa", price: 6.99, requires_text: true, requires_number: true, requires_flag: true, is_active: true, sort_order: 1 },
                      { label: "Bandera o emoji", description: "Agrega una bandera o emoji", price: 4.99, requires_text: false, requires_number: false, requires_flag: true, is_active: true, sort_order: 2 },
                    ]
                  : prev.product_customization_options,
              }));
            }} />Permitir personalización</label>
          </div>
          {values.personalization_enabled && <div className="space-y-3">
            {(values.product_customization_options || []).map((option, index) => (
              <div key={index} className="rounded-xl border border-white/10 bg-zinc-950 p-3">
                <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                  <input value={option.label} onChange={(e) => updateCustomization(index, "label", e.target.value)} placeholder="Ej: Nombre y/o número" className="input-admin" />
                  <input type="number" min="0" step="0.01" value={option.price} onChange={(e) => updateCustomization(index, "price", Number(e.target.value))} placeholder="Adicional S/" className="input-admin" />
                  <button type="button" onClick={() => setValues((prev) => ({ ...prev, product_customization_options: (prev.product_customization_options || []).filter((_, i) => i !== index) }))} className="rounded-xl bg-red-500/10 p-3 text-red-300"><Trash2 size={18} /></button>
                </div>
                <input value={option.description || ""} onChange={(e) => updateCustomization(index, "description", e.target.value)} placeholder="Descripción opcional" className="input-admin mt-2" />
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-300">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={option.requires_text} onChange={(e) => updateCustomization(index, "requires_text", e.target.checked)} />Nombre/texto</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={option.requires_number} onChange={(e) => updateCustomization(index, "requires_number", e.target.checked)} />Número</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={option.requires_flag} onChange={(e) => updateCustomization(index, "requires_flag", e.target.checked)} />Bandera/emoji</label>
                </div>
              </div>
            ))}
            <button type="button" onClick={addCustomization} className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-bold text-fuchsia-100"><Plus size={16} />Agregar opción</button>
          </div>}
        </section>

        <Field label="Descripción"><textarea value={values.description} onChange={(e) => setField("description", e.target.value)} rows={3} className="input-admin" /></Field>
        <Field label="Características, una por línea"><textarea value={featuresText} onChange={(e) => setField("features", e.target.value.split("\n").map((item) => item.trim()).filter(Boolean))} rows={5} className="input-admin" /></Field>
        <Field label="Recomendado para"><textarea value={values.recommended_for} onChange={(e) => setField("recommended_for", e.target.value)} rows={2} className="input-admin" /></Field>

        <div className="mb-6 grid gap-4 md:grid-cols-2">
          <div><p className="mb-2 text-sm font-bold text-white">Nivel</p><div className="flex flex-wrap gap-2">{levels.map((level) => <label key={level} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300"><input type="checkbox" checked={values.level.includes(level)} onChange={() => toggleLevel(level)} />{level}</label>)}</div></div>
          <div><p className="mb-2 text-sm font-bold text-white">Visibilidad</p><label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300"><input type="checkbox" checked={values.is_active} onChange={(e) => setField("is_active", e.target.checked)} />Producto visible</label></div>
        </div>

        <div className="flex flex-col justify-end gap-3 border-t border-white/10 pt-5 sm:flex-row">
          <button type="button" onClick={onClose} className="rounded-xl bg-white/5 px-5 py-3 font-bold text-white">Cancelar</button>
          <button type="submit" disabled={saving || uploading || uploadingGuide} className="rounded-xl bg-[#e3262e] px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? "Guardando..." : "Guardar producto"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="mb-2 block text-sm font-bold text-white">{label}</span>{children}</label>;
}
