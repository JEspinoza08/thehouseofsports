import { supabase } from "./supabase";
import { Product } from "../data/products";

let productsCache: Promise<Product[]> | null = null;

export function invalidateProductsCache() {
  productsCache = null;
}

export function getProducts(): Promise<Product[]> {
  if (!productsCache) {
    productsCache = fetchProducts().catch((error) => {
      productsCache = null;
      throw error;
    });
  }
  return productsCache;
}

async function fetchProducts(): Promise<Product[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_variants (*),
        product_images (*),
        product_customization_options (*)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .abortSignal(controller.signal);

    if (error) throw error;

    return (data || []).map((p: any) => {
      const gallery = (p.product_images || [])
        .filter((img: any) => img.image_url)
        .sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
      const primary = gallery.find((img: any) => img.is_primary)?.image_url || p.image_url || gallery[0]?.image_url || "";

      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: Number(p.price),
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        label: p.label,
        image: primary,
        images: gallery.map((img: any) => ({
          id: String(img.id),
          url: img.image_url,
          sortOrder: Number(img.sort_order || 0),
          isPrimary: Boolean(img.is_primary),
        })),
        description: p.description,
        features: p.features || [],
        recommendedFor: p.recommended_for,
        level: p.level || [],
        playStyle: p.play_style,
        weight: p.weight || undefined,
        isOffer: p.is_offer,
        stock: p.stock,
        hasVariants: p.has_variants,
        variants: (p.product_variants || []).map((v: any) => ({
          id: String(v.id),
          productId: v.product_id,
          variantType: v.variant_type,
          variantValue: v.variant_value,
          colorName: v.color_name || null,
          colorHex: v.color_hex || null,
          stock: Number(v.stock || 0),
          isActive: v.is_active,
        })),
        personalizationEnabled: Boolean(p.personalization_enabled),
        sizeGuideUrl: p.size_guide_url || undefined,
        filterAttributes: p.filter_attributes && typeof p.filter_attributes === "object" ? p.filter_attributes : {},
        customizationOptions: (p.product_customization_options || [])
          .filter((o: any) => o.is_active)
          .sort((a: any, b: any) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
          .map((o: any) => ({
            id: String(o.id),
            label: o.label,
            description: o.description,
            price: Number(o.price || 0),
            requiresText: Boolean(o.requires_text),
            requiresNumber: Boolean(o.requires_number),
            requiresFlag: Boolean(o.requires_flag),
            isActive: Boolean(o.is_active),
            sortOrder: Number(o.sort_order || 0),
          })),
      } as Product;
    });
  } finally {
    clearTimeout(timeout);
  }
}
