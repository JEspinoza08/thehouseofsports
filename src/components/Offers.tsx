import ProductsSection from "./ProductsSection";
import { Product } from "../data/products";

export default function Offers({
  onViewDetail,
}: {
  onViewDetail: (product: Product) => void;
}) {
  return (
    <ProductsSection
      onViewDetail={onViewDetail}
      initialCategory={null}
      searchQuery=""
      offersOnly
    />
  );
}