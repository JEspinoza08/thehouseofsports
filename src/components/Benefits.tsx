import { BadgeCheck, Palette, ShieldCheck, Truck } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

const benefits = [
  { icon: Truck, title: "Envío gratis", desc: "Desde S/400 a todo el Perú" },
  { icon: BadgeCheck, title: "Productos originales", desc: "Equipamiento original seleccionado" },
  { icon: Palette, title: "Personalización a tu gusto", desc: "Hazlos únicos con nuestro servicio" },
  { icon: ShieldCheck, title: "Pagos seguros", desc: "Compra protegida de principio a fin" },
];

export default function Benefits() {
  const item = (benefit: typeof benefits[number]) => {
    const Icon = benefit.icon;
    return <div className="flex min-h-[92px] items-center gap-3 border-r border-white/10 px-5 py-4 lg:min-h-[98px] lg:px-7 lg:py-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e3262e]/50 bg-[#e3262e]/5 text-[#e3262e] lg:h-11 lg:w-11"><Icon size={19} strokeWidth={1.8} /></div>
      <div className="min-w-0"><h3 className="text-[10px] font-black uppercase leading-tight text-white lg:text-[11px]">{benefit.title}</h3><p className="mt-1 text-[9px] leading-relaxed text-white/55 lg:text-[10px]">{benefit.desc}</p></div>
    </div>;
  };

  return <section className="border-y border-white/10 bg-[#111214] text-white">
    <div className="overflow-hidden lg:hidden"><Swiper modules={[Autoplay]} loop slidesPerView={1.25} speed={2500} allowTouchMove={false} autoplay={{ delay: 0, disableOnInteraction: false }} className="benefits-marquee w-full">{benefits.map((b) => <SwiperSlide key={b.title}>{item(b)}</SwiperSlide>)}</Swiper></div>
    <div className="hidden lg:block"><div className="padel-container grid grid-cols-4">{benefits.map((b) => <div key={b.title}>{item(b)}</div>)}</div></div>
  </section>;
}
