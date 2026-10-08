import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductsSection from "../components/ProductsSection";
import ProductModal from "../components/ProductModal";
import { Category, Product } from "../data/products";

type CatalogPageProps = {
  title: string;
  subtitle: string;
  category: Category;
  selectedBrand?: string;
};

export default function CatalogPage({
  title,
  subtitle,
  category,
  selectedBrand,
}: CatalogPageProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={setSearchQuery} />

      <section className="pt-24 pb-12 px-6 bg-neutral-50 text-neutral-950">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#e3262e] font-bold uppercase text-sm">
            The House of Sports
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl font-black uppercase tracking-tight">{title}</h1>
          <p className="mt-4 max-w-2xl text-neutral-950/70 text-lg">{subtitle}</p>
        </div>
      </section>

      <ProductsSection
  onViewDetail={setSelectedProduct}
  initialCategory={category}
  searchQuery={searchQuery}
  selectedBrand={selectedBrand}
/>

      <Footer />

      {selectedProduct && (
        <ProductModal
  product={selectedProduct}
  onClose={() => setSelectedProduct(null)}
/>
      )}
    </div>
  );
}