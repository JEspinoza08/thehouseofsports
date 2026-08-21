import { useEffect, useState } from "react";
import { FileImage, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { supabase } from "../../lib/supabase";

type Banner = {
  id?: string;
  title: string;
  desktop_image_url: string;
  mobile_image_url: string;
  target_url: string;
  brand_filter: string;
  is_active: boolean;
  sort_order: number;
};

const emptyBanner = (): Banner => ({
  title: "",
  desktop_image_url: "",
  mobile_image_url: "",
  target_url: "",
  brand_filter: "",
  is_active: true,
  sort_order: 0,
});

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("hero_banners")
      .select("*")
      .order("sort_order");
    if (error) alert(error.message);
    setBanners((data || []) as Banner[]);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const validateBannerFile = async (file: File, field: "desktop_image_url" | "mobile_image_url") => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Formato no permitido. Usa JPG, PNG, WEBP o GIF.");
    }

    // GIFs are displayed natively by <img>. Reading the first frame is enough
    // to validate the canvas dimensions without altering the animation.
    const expected = field === "desktop_image_url"
      ? { width: 1920, height: 800, label: "1920 × 800 px" }
      : { width: 1080, height: 1350, label: "1080 × 1350 px" };

    const objectUrl = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("No se pudo leer el archivo seleccionado."));
        image.src = objectUrl;
      });

      if (dimensions.width !== expected.width || dimensions.height !== expected.height) {
        throw new Error(`Este banner debe medir exactamente ${expected.label}. El archivo seleccionado mide ${dimensions.width} × ${dimensions.height} px.`);
      }
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const upload = async (file: File, field: "desktop_image_url" | "mobile_image_url") => {
    await validateBannerFile(file, field);
    const ext = file.name.split(".").pop()?.toLowerCase() || "webp";
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("productos")
      .upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
        upsert: false,
      });
    if (error) throw error;
    return supabase.storage.from("productos").getPublicUrl(path).data.publicUrl;
  };

  const updateLocal = (
    index: number,
    key: keyof Banner,
    value: string | boolean | number,
  ) => {
    setBanners((current) =>
      current.map((banner, i) =>
        i === index ? { ...banner, [key]: value } : banner,
      ),
    );
  };

  const save = async (banner: Banner) => {
    if (!banner.desktop_image_url || !banner.mobile_image_url) {
      alert("Debes cargar una imagen web y una imagen mobile.");
      return;
    }
    setSavingId(banner.id || "new");
    const payload = {
      title: banner.title || null,
      desktop_image_url: banner.desktop_image_url,
      mobile_image_url: banner.mobile_image_url,
      target_url: banner.target_url || null,
      brand_filter: banner.brand_filter || null,
      is_active: banner.is_active,
      sort_order: Number(banner.sort_order || 0),
      updated_at: new Date().toISOString(),
    };
    const result = banner.id
      ? await supabase.from("hero_banners").update(payload).eq("id", banner.id)
      : await supabase.from("hero_banners").insert(payload);
    setSavingId(null);
    if (result.error) alert(result.error.message);
    else await load();
  };

  const remove = async (banner: Banner, index: number) => {
    if (!banner.id) {
      setBanners((current) => current.filter((_, i) => i !== index));
      return;
    }
    if (!confirm("¿Eliminar este banner?")) return;
    const { error } = await supabase
      .from("hero_banners")
      .delete()
      .eq("id", banner.id);
    if (error) alert(error.message);
    else await load();
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white xl:pl-[15.5rem]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#e3262e]">
              The House of Sports
            </p>
            <h1 className="text-3xl font-black">Banners web y mobile</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Carga imágenes o GIF animados para el hero sin volver a desplegar el proyecto.
            </p>
          </div>
          <button
            onClick={() =>
              setBanners((current) => [
                ...current,
                { ...emptyBanner(), sort_order: current.length * 10 },
              ])
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#e3262e] px-4 py-3 text-sm font-black"
          >
            <Plus size={17} />
            Nuevo banner
          </button>
        </div>
        <AdminNav />
        {loading ? (
          <p className="text-zinc-400">Cargando...</p>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <section
                key={banner.id || `new-${index}`}
                className="rounded-2xl border border-white/10 bg-zinc-900 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-2">
                  {(["desktop_image_url", "mobile_image_url"] as const).map(
                    (field) => (
                      <div key={field}>
                        <div className="mb-2">
                          <p className="text-sm font-bold">
                            {field === "desktop_image_url"
                              ? "Banner web / desktop"
                              : "Banner mobile"}
                          </p>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <p className="inline-flex rounded-md bg-white/5 px-2 py-1 text-xs font-semibold text-zinc-400">
                              {field === "desktop_image_url" ? "1920 × 800 px" : "1080 × 1350 px"}
                            </p>
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#e3262e]/10 px-2 py-1 text-[11px] font-bold text-red-300">
                              <FileImage size={12} /> JPG · PNG · WEBP · GIF
                            </span>
                          </div>
                        </div>
                        <label className="flex min-h-44 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/20">
                          {banner[field] ? (
                            <div className="relative w-full">
                              <img
                                src={banner[field]}
                                alt="Banner"
                                className="max-h-64 w-full object-contain"
                              />
                              {banner[field].toLowerCase().split("?")[0].endsWith(".gif") && (
                                <span className="absolute right-3 top-3 rounded-full bg-[#e3262e] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
                                  GIF animado
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                              <ImagePlus size={18} />
                              Seleccionar imagen o GIF
                            </span>
                          )}
                          <input
                            className="hidden"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,.gif"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              try {
                                updateLocal(index, field, await upload(file, field));
                              } catch (error) {
                                alert(
                                  error instanceof Error
                                    ? error.message
                                    : "No se pudo subir",
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <input
                    className="input-admin"
                    placeholder="Título interno"
                    value={banner.title}
                    onChange={(e) =>
                      updateLocal(index, "title", e.target.value)
                    }
                  />
                  <input
                    className="input-admin"
                    placeholder="Marca a filtrar, ej. POKER"
                    value={banner.brand_filter}
                    onChange={(e) =>
                      updateLocal(index, "brand_filter", e.target.value)
                    }
                  />
                  <input
                    className="input-admin"
                    placeholder="URL opcional /guantes"
                    value={banner.target_url}
                    onChange={(e) =>
                      updateLocal(index, "target_url", e.target.value)
                    }
                  />
                  <input
                    className="input-admin"
                    type="number"
                    placeholder="Orden"
                    value={banner.sort_order}
                    onChange={(e) =>
                      updateLocal(index, "sort_order", Number(e.target.value))
                    }
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={banner.is_active}
                      onChange={(e) =>
                        updateLocal(index, "is_active", e.target.checked)
                      }
                    />
                    Banner activo
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => remove(banner, index)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                    <button
                      onClick={() => save(banner)}
                      disabled={savingId === (banner.id || "new")}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-black disabled:opacity-50"
                    >
                      <Save size={16} />
                      Guardar
                    </button>
                  </div>
                </div>
              </section>
            ))}
            {!banners.length && (
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center text-zinc-400">
                No hay banners dinámicos todavía. El home seguirá usando los
                banners locales hasta que agregues el primero.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
