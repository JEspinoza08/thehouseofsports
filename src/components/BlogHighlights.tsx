import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function BlogHighlights() {
  const [posts,setPosts]=useState<any[]>([]);
  useEffect(()=>{supabase.from("blog_posts").select("id,slug,title,excerpt,cover_image_url,category").eq("status","published").order("published_at",{ascending:false}).limit(3).then(({data})=>setPosts(data??[]));},[]);
  if(!posts.length)return null;
  return <section className="bg-white py-12 lg:py-16"><div className="padel-container"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[#e3262e]">THS Journal</p><h2 className="mt-2 text-3xl font-black uppercase italic tracking-[-.04em]">Últimas novedades</h2></div><Link to="/blog" className="hidden items-center gap-2 text-xs font-black uppercase sm:flex">Ver todo <ArrowRight size={14}/></Link></div><div className="mt-7 grid gap-4 md:grid-cols-3">{posts.map((p)=><Link key={p.id} to={`/blog/${p.slug}`} className="group overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50"><div className="aspect-[16/10] overflow-hidden bg-neutral-100">{p.cover_image_url&&<img src={p.cover_image_url} alt={p.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>}</div><div className="p-4"><p className="text-[9px] font-black uppercase tracking-wide text-[#e3262e]">{p.category||"Novedades"}</p><h3 className="mt-2 text-lg font-black leading-tight">{p.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">{p.excerpt}</p></div></Link>)}</div></div></section>;
}
