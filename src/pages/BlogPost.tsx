import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function BlogPost() {
  const { slug } = useParams(); const [post,setPost]=useState<any>(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{ if(!slug)return; supabase.from("blog_posts").select("*").eq("slug",slug).eq("status","published").single().then(({data})=>{setPost(data);setLoading(false);}); },[slug]);
  return <div className="min-h-screen bg-white"><Header onSearch={()=>{}}/><main className="padel-container py-10 lg:py-14">{loading ? <p>Cargando...</p> : !post ? <div><h1 className="text-3xl font-black">Artículo no encontrado</h1><Link to="/blog" className="mt-5 inline-flex text-[#e3262e]">Volver al blog</Link></div> : <article className="mx-auto max-w-4xl"><Link to="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-[#e3262e]"><ArrowLeft size={17}/>Volver al blog</Link><p className="mt-8 text-[11px] font-black uppercase tracking-[.14em] text-[#e3262e]">{post.category || "Novedades"}</p><h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-[-.04em] lg:text-6xl">{post.title}</h1>{post.published_at&&<p className="mt-5 flex items-center gap-2 text-sm text-neutral-500"><CalendarDays size={16}/>{new Date(post.published_at).toLocaleDateString("es-PE",{dateStyle:"long"})}</p>}{post.cover_image_url&&<img src={post.cover_image_url} alt={post.title} className="mt-8 aspect-[16/8] w-full rounded-2xl object-cover"/>}<div className="mt-9 whitespace-pre-wrap text-[16px] leading-8 text-neutral-700">{post.content}</div></article>}</main><Footer/></div>;
}
