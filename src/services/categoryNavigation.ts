import { supabase } from "../lib/supabase";

export type CategoryNavLink = {
  label: string;
  href: string;
  slug: string;
};

export const fallbackCategoryLinks: CategoryNavLink[] = [
  { label: "Guantes de arquero", href: "/guantes", slug: "guantes" },
  { label: "Chimpunes", href: "/zapatillas", slug: "zapatillas" },
  { label: "Protecciones", href: "/categoria/protecciones", slug: "protecciones" },
  { label: "Ropa deportiva", href: "/ropa", slug: "ropa" },
  { label: "Accesorios", href: "/accesorios", slug: "accesorios" },
];

const categoryLabelOverrides: Record<string, string> = {
  guantes: "Guantes de arquero",
  zapatillas: "Chimpunes",
  protecciones: "Protecciones",
  ropa: "Ropa deportiva",
  accesorios: "Accesorios",
};

const categoryHref = (slug: string) =>
  ["guantes", "zapatillas", "ropa", "accesorios"].includes(slug)
    ? `/${slug}`
    : `/categoria/${slug}`;

export async function getMainCategoryLinks(limit = 6): Promise<CategoryNavLink[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("name,slug")
    .eq("is_active", true)
    .neq("slug", "ofertas")
    .order("sort_order")
    .limit(limit);

  if (error) {
    console.error("No se pudieron cargar las categorías del menú:", error);
    return fallbackCategoryLinks.slice(0, limit);
  }

  if (!data?.length) return fallbackCategoryLinks.slice(0, limit);

  return data.map((row: any) => ({
    slug: row.slug,
    label: categoryLabelOverrides[row.slug] || row.name,
    href: categoryHref(row.slug),
  }));
}
