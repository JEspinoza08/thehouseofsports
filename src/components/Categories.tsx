import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { categories as fallbackCategories } from "../data/products";
import { supabase } from "../lib/supabase";

type CategoryCard = { id: string; label: string; image: string };
interface CategoriesProps { onSelect: (categoryId: string) => void; }

export default function Categories({ onSelect }: CategoriesProps) {
  const [items,setItems]=useState<CategoryCard[]>(fallbackCategories.map((c)=>({id:c.id,label:c.label,image:c.image})));
  const desktopTrack = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    supabase.from("categories").select("slug,name,image_url").eq("is_active",true).eq("show_home",true).order("sort_order").then(({data,error})=>{
      if(!error && data?.length) setItems(data.map((row:any)=>({id:row.slug,label:row.name,image:row.image_url || fallbackCategories.find((c)=>c.id===row.slug)?.image || fallbackCategories[0].image})));
    });
  },[]);
  const visible=items.slice(0,12);
  const card=(cat:CategoryCard,mobile=false)=><button key={cat.id} type="button" onClick={()=>onSelect(cat.id)} className={`group relative shrink-0 overflow-hidden rounded-[8px] border border-white/10 bg-[#151719] text-left ${mobile?"h-[220px] w-[44vw] min-w-[158px] max-w-[190px] snap-start":"h-[250px] w-[250px] xl:w-[268px]"}`}>
    <img src={cat.image} alt={cat.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"/><div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent"/><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#e3262e]">Categoría</p><h3 className="mt-1 text-[13px] font-black uppercase leading-tight text-white">{cat.label}</h3></div><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 bg-black/30 transition group-hover:border-[#e3262e] group-hover:bg-[#e3262e]"><ArrowRight size={15}/></span></div>
  </button>;
  const scrollDesktop=(direction:number)=>desktopTrack.current?.scrollBy({left:direction*620,behavior:"smooth"});
  return <section id="categorias" className="bg-[#08090a] py-10 text-white lg:py-16"><div className="padel-container"><div className="mb-6 text-center lg:mb-9"><p className="mb-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#e3262e]">Explora por categorías</p><h2 className="text-[24px] font-black uppercase italic tracking-[-0.04em] lg:text-[31px]">Lo mejor para tu juego</h2></div><div className="lg:hidden"><div className="categories-mobile-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">{visible.map((cat)=>card(cat,true))}</div></div><div className="relative hidden lg:block"><button type="button" onClick={()=>scrollDesktop(-1)} className="absolute -left-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/80 text-white shadow-xl backdrop-blur transition hover:border-[#e3262e] hover:bg-[#e3262e]"><ArrowLeft size={19}/></button><div ref={desktopTrack} className="flex gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{visible.map((cat)=>card(cat))}</div><button type="button" onClick={()=>scrollDesktop(1)} className="absolute -right-5 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/80 text-white shadow-xl backdrop-blur transition hover:border-[#e3262e] hover:bg-[#e3262e]"><ArrowRight size={19}/></button></div></div></section>;
}
