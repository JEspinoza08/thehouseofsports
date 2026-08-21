import banner from "../assets/Banner.webp";
import { useNavigate } from "react-router-dom";
import { Product } from "../data/products";
interface CategoryBannerProps {
  onViewDetail: (product: Product) => void;
}

export default function CategoryBanner({ onViewDetail: _onViewDetail }: CategoryBannerProps) {
  const navigate = useNavigate();
  const go = (href: string) => {
    navigate(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  return (
    <section className="bg-white py-10">
      <div className="padel-container">
        <div
          className="relative min-h-[300px] overflow-hidden rounded-[8px] bg-black bg-cover bg-center lg:min-h-[390px]"
          style={{
            backgroundImage: `url(${banner})`,
          }}
        >
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10 flex h-full min-h-[300px] items-end p-8 lg:min-h-[390px] lg:p-12">
            <div className="text-white">
              <h2 className="text-[34px] font-black uppercase leading-none tracking-[-0.04em] lg:text-[48px]">
                Guantes de <br /> Arquero
              </h2>

              <button
                onClick={() => go("/guantes")}
                className="mt-5 text-[12px] font-black uppercase text-white underline underline-offset-4 hover:text-[#e3262e]"
              >
                Ver todos los modelos
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
