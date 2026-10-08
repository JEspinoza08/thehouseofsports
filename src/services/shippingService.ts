import { supabase } from "../lib/supabase";

const PAGE_SIZE = 1000;

export async function getDepartments(): Promise<string[]> {
  const departments: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("department")
      .eq("is_active", true)
      .order("department", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data ?? [];

    departments.push(
      ...rows
        .map((item) => item.department?.trim())
        .filter(Boolean),
    );

    if (rows.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return [...new Set(departments)];
}

export async function getProvinces(
  department: string,
): Promise<string[]> {
  const provinces: string[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("province")
      .eq("department", department)
      .eq("is_active", true)
      .order("province", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data ?? [];

    provinces.push(
      ...rows
        .map((item) => item.province?.trim())
        .filter(Boolean),
    );

    if (rows.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  return [...new Set(provinces)];
}

export async function getDistricts(
  department: string,
  province: string,
): Promise<Array<{ district: string; price: number }>> {
  const districts: Array<{ district: string; price: number }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("district, price")
      .eq("department", department)
      .eq("province", province)
      .eq("is_active", true)
      .order("district", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data ?? [];

    districts.push(
      ...rows.map((item) => ({
        district: item.district?.trim(),
        price: Number(item.price),
      })),
    );

    if (rows.length < PAGE_SIZE) break;

    from += PAGE_SIZE;
  }

  const uniqueDistricts = new Map<
    string,
    { district: string; price: number }
  >();

  districts.forEach((item) => {
    if (item.district && !uniqueDistricts.has(item.district)) {
      uniqueDistricts.set(item.district, item);
    }
  });

  return Array.from(uniqueDistricts.values());
}

export async function getShippingRate(
  department: string,
  province: string,
  district: string,
) {
  const { data, error } = await supabase
    .from("shipping_rates")
    .select("*")
    .eq("department", department)
    .eq("province", province)
    .eq("district", district)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error(
      "No existe una tarifa para la ubicación seleccionada.",
    );
  }

  return data;
}