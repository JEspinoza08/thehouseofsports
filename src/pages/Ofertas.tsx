import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Offers from "../components/Offers";
import ProductModal from "../components/ProductModal";
import { Product } from "../data/products";

export default function Ofertas() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={() => {}} />

      <section className="pt-24 pb-12 px-6 bg-neutral-50 text-neutral-950">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#e3262e] font-bold uppercase text-sm">
            Promociones
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl font-black uppercase tracking-tight">
            Ofertas especiales
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-950/70 text-lg">
            Encuentra productos seleccionados de nuestras marcas con precios especiales, últimas unidades y oportunidades por tiempo limitado.
          </p>
        </div>
      </section>

      <Offers onViewDetail={setSelectedProduct} />

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
