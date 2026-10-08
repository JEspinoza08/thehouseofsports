import { useSearchParams } from "react-router-dom";
import CatalogPage from "./CatalogPage";

export default function Guantes() {
  const [searchParams] = useSearchParams();
  const brand = searchParams.get("brand") || "";

  return (
    <CatalogPage
      title={brand ? `Guantes ${brand}` : "Guantes de arquero"}
      subtitle={
        brand
          ? `Explora productos de la marca ${brand}.`
          : "Encuentra guantes POKER desarrollados para ofrecer agarre, comodidad y rendimiento bajo los tres palos."
      }
      category="guantes"
      selectedBrand={brand}
    />
  );
}