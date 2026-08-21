import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import webbanner1 from "../assets/banner1.png";
import webbanner2 from "../assets/banner2.png";
import webbanner3 from "../assets/banner3.png";
import webbanner4 from "../assets/banner4.png";
import webbannermob1 from "../assets/heromobile1.webp";
import webbannermob2 from "../assets/heromobile2.webp";
import webbannermob3 from "../assets/heromobile3.webp";
import webbannermob4 from "../assets/heromobile4.webp";

type Slide = { id?: string; desktop: string; mobile: string; brand: string; targetUrl?: string | null };
const fallbackSlides: Slide[] = [
  { desktop: webbanner1, mobile: webbannermob1, brand: "POKER" },
  { desktop: webbanner2, mobile: webbannermob2, brand: "" },
  { desktop: webbanner3, mobile: webbannermob3, brand: "" },
  { desktop: webbanner4, mobile: webbannermob4, brand: "" },
];

interface HeroProps { onShopNow: (brand?: string) => void; }

export default function Hero({ onShopNow }: HeroProps) {
  const [slides, setSlides] = useState<Slide[]>(fallbackSlides);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("hero_banners").select("id,desktop_image_url,mobile_image_url,brand_filter,target_url").eq("is_active", true).order("sort_order")
      .then(({ data, error }) => {
        if (!error && data?.length) {
          setSlides(data.map((row: any) => ({ id: row.id, desktop: row.desktop_image_url, mobile: row.mobile_image_url, brand: row.brand_filter || "", targetUrl: row.target_url })));
        }
      });
  }, []);

  const handleClick = (slide: Slide) => {
    if (slide.targetUrl) {
      if (/^https?:\/\//i.test(slide.targetUrl)) window.location.href = slide.targetUrl;
      else navigate(slide.targetUrl);
      return;
    }
    onShopNow(slide.brand || undefined);
  };

  return <section id="inicio" className="relative w-full overflow-hidden bg-[#08090a]">
    <Swiper modules={[Autoplay,Navigation,Pagination]} loop={slides.length > 1} speed={850} autoplay={{delay:5200,disableOnInteraction:false}} pagination={{clickable:true,el:".ths-hero-pagination"}} navigation={{nextEl:".ths-next",prevEl:".ths-prev"}} className="w-full">
      {slides.map((slide,index)=><SwiperSlide key={slide.id || index} className="!h-auto"><div className="relative w-full bg-[#08090a]">
        <img src={slide.mobile} alt={`Banner THS ${index+1}`} className="block h-auto w-full lg:hidden" draggable={false}/>
        <img src={slide.desktop} alt={`Banner THS ${index+1}`} className="hidden h-auto w-full lg:block" draggable={false}/>
        <button type="button" onClick={()=>handleClick(slide)} aria-label="Ver productos" className="absolute inset-0 z-10"/>
      </div></SwiperSlide>)}
    </Swiper>
    <button type="button" aria-label="Banner anterior" className="ths-prev absolute left-4 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:border-[#e3262e] hover:text-[#e3262e] lg:grid xl:left-8"><ChevronLeft size={22}/></button>
    <button type="button" aria-label="Siguiente banner" className="ths-next absolute right-4 top-1/2 z-30 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:border-[#e3262e] hover:text-[#e3262e] lg:grid xl:right-8"><ChevronRight size={22}/></button>
    <div className="ths-hero-pagination absolute bottom-3 left-0 right-0 z-30 flex justify-center gap-1 lg:bottom-5"/>
  </section>;
}
