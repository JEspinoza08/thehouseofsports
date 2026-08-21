export type Category = string;
export type Brand = string;
export type Level = "Entrenamiento" | "Pre profesional" | "Profesional";
export type PlayStyle = string;
export type Weight = "Ligera" | "Pesada";
export type Label = "Nuevo" | "Oferta" | "Más vendido" | "Recomendado" | string;

import guante1 from "../assets/guantes.webp";
import categoria1 from "../assets/guantes.webp";
import categoria2 from "../assets/zapatillas.webp";
import categoria3 from "../assets/accesorio.webp";
import categoria4 from "../assets/accesorio.webp";
import categoria5 from "../assets/ropa.webp";

export type VariantType = "size" | "shoe_size";
export const WHATSAPP_NUMBER = "51993834954";
export const buildWhatsAppAdvisorUrl = (message?: string) => {
  const defaultMessage =
    "Hola The House of Sports 👋 Quisiera recibir asesoría sobre sus productos.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    message || defaultMessage,
  )}`;
};

export interface ProductVariant {
  id: string;
  productId: string | number;
  variantType: VariantType;
  variantValue: string;
  colorName?: string | null;
  colorHex?: string | null;
  stock: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary?: boolean;
}

export interface CustomizationOption {
  id: string;
  label: string;
  description?: string | null;
  price: number;
  requiresText: boolean;
  requiresNumber: boolean;
  requiresFlag: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string | number;
  name: string;
  brand: Brand;
  category: Category;
  price: number;
  originalPrice?: number;
  label: Label;
  image: string;
  images?: ProductImage[];
  description: string;
  features: string[];
  recommendedFor: string;
  level: Level[];
  playStyle: PlayStyle;
  weight?: Weight;
  isOffer: boolean;
  stock?: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  personalizationEnabled?: boolean;
  customizationOptions?: CustomizationOption[];
  sizeGuideUrl?: string;
  filterAttributes?: Record<string, string>;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Guante de arquero THS",
    brand: "POKER",
    category: "guantes",
    price: 1899,
    label: "Nuevo",
    image: guante1,
    description:
      "Guante de arquero diseñado para brindar agarre, protección y seguridad durante el juego.",
    features: [
      "Palma de alto agarre",
      "Ajuste seguro",
      "Protección para arquero",
      "Acabado deportivo",
      "Uso en entrenamiento y competencia",
    ],
    recommendedFor: "Arqueros que buscan agarre, comodidad y protección.",
    level: ["Profesional"],
    playStyle: "Negativo",
    weight: undefined,
    isOffer: false,
  },
];

export const categories = [
  { id: "guantes", label: "Guantes", icon: "🧤", image: categoria1 },
  { id: "zapatillas", label: "Zapatillas", icon: "👟", image: categoria2 },
  { id: "rodilleras", label: "Rodilleras", icon: "🛡️", image: categoria3 },
  { id: "accesorios", label: "Accesorios", icon: "⚽", image: categoria4 },
  { id: "ropa", label: "Ropa", icon: "👕", image: categoria5 },
];
