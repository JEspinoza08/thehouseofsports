import { useState } from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import Categories from "../components/Categories";
import ProductsSection from "../components/ProductsSection";
import Trust from "../components/Trust";
import Contact from "../components/Contact";
import BlogHighlights from "../components/BlogHighlights";
import Footer from "../components/Footer";
import ProductModal from "../components/ProductModal";
import ComboSection from "../components/ComboSection";
import BrandFinder from "../components/BrandFinder";
import { Product, Category } from "../data/products";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
 const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

const [searchQuery, setSearchQuery] = useState("");

const [selectedBrand] = useState<string>("");
  const scrollToProducts = (brand?: string) => {
  if (brand) {
    navigate(`/guantes?brand=${encodeURIComponent(brand)}`);
    return;
  }

  document
    .getElementById("productos")
    ?.scrollIntoView({ behavior: "smooth" });
};
  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === "ofertas") {
      setSelectedCategory(null);
      setTimeout(scrollToProducts, 80);
      return;
    }
    setSelectedCategory(categoryId as Category);
    setTimeout(scrollToProducts, 80);
  };

  return (
    <div className="min-h-screen bg-white text-neutral-950">
      <Header onSearch={setSearchQuery} />
      <Hero onShopNow={scrollToProducts} />
      <Benefits />
      <Categories onSelect={handleCategorySelect} />
      <ProductsSection
        onViewDetail={setSelectedProduct}
        initialCategory={selectedCategory}
        searchQuery={searchQuery}
        selectedBrand={selectedBrand}
      />
      <ComboSection />
      <BlogHighlights />
      <BrandFinder />
      <Trust />
      <Contact />
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
