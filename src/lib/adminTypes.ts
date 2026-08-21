export type AdminProductVariant = {
  id?: string;
  product_id?: string;
  variant_type: "size" | "shoe_size";
  variant_value: string;
  color_name?: string | null;
  color_hex?: string | null;
  stock: number;
  is_active: boolean;
};

export type AdminProductImage = {
  id?: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
};

export type AdminCustomizationOption = {
  id?: string;
  label: string;
  description?: string | null;
  price: number;
  requires_text: boolean;
  requires_number: boolean;
  requires_flag: boolean;
  is_active: boolean;
  sort_order: number;
};

export type AdminProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  original_price: number | null;
  label: string;
  image_url: string;
  description: string;
  features: string[];
  recommended_for: string;
  level: string[];
  play_style: string;
  weight: string | null;
  is_offer: boolean;
  stock: number;
  has_variants: boolean;
  personalization_enabled: boolean;
  size_guide_url?: string | null;
  filter_attributes?: Record<string, string>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  product_variants?: AdminProductVariant[];
  product_images?: AdminProductImage[];
  product_customization_options?: AdminCustomizationOption[];
};

export type ProductFormValues = Omit<
  AdminProduct,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
};
