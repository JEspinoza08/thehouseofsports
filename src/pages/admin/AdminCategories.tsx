import { useEffect, useState } from "react";
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { supabase } from "../../lib/supabase";

type CategoryRow = { id?: string; name: string; slug: string; image_url: string; is_active: boolean; show_home: boolean; sort_order: number };
const slugify = (text: string) => text.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

export default function AdminCategories() {
  const [items,setItems]=useState<CategoryRow[]>([]);
  const [loading,setLoading]=useState(true);

  const load=async()=>{ setLoading(true); const {data,error}=await supabase.from("categories").select("*").order("sort_order"); if(error) alert(error.message); setItems((data||[]) as CategoryRow[]); setLoading(false); };
  useEffect(()=>{load().catch(console.error)},[]);

  const upload=async(file:File)=>{ const ext=file.name.split(".").pop()||"webp"; const path=`categorias/${crypto.randomUUID()}.${ext}`; const {error}=await supabase.storage.from("productos").upload(path,file,{cacheControl:"3600"}); if(error) throw error; return supabase.storage.from("productos").getPublicUrl(path).data.publicUrl; };
  const patch=(index:number,key:keyof CategoryRow,value:string|boolean|number)=>setItems((current)=>current.map((item,i)=>i===index?{...item,[key]:value}:item));
  const save=async(item:CategoryRow)=>{ if(!item.name.trim()) return alert("Ingresa el nombre de la categoría."); const payload={name:item.name.trim(),slug:slugify(item.slug||item.name),image_url:item.image_url||null,is_active:item.is_active,show_home:item.show_home,sort_order:Number(item.sort_order||0),updated_at:new Date().toISOString()}; const result=item.id?await supabase.from("categories").update(payload).eq("id",item.id):await supabase.from("categories").insert(payload); if(result.error) alert(result.error.message); else await load(); };
  const remove=async(item:CategoryRow,index:number)=>{ if(!item.id){setItems((current)=>current.filter((_,i)=>i!==index));return;} if(!confirm("¿Eliminar la categoría? Los productos existentes conservarán el texto de categoría, pero ya no aparecerá como opción administrable."))return; const {error}=await supabase.from("categories").delete().eq("id",item.id); if(error) alert(error.message); else await load(); };

  return <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white xl:pl-[15.5rem]"><div className="mx-auto max-w-7xl">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-[#e3262e]">The House of Sports</p><h1 className="text-3xl font-black">Categorías</h1><p className="mt-1 text-sm text-zinc-400">Crea categorías y decide cuáles aparecen en el home.</p></div><button onClick={()=>setItems((current)=>[...current,{name:"",slug:"",image_url:"",is_active:true,show_home:true,sort_order:current.length*10}])} className="inline-flex items-center gap-2 rounded-xl bg-[#e3262e] px-4 py-3 text-sm font-black"><Plus size={17}/>Nueva categoría</button></div>
    <AdminNav />
    {loading?<p className="text-zinc-400">Cargando...</p>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item,index)=><section key={item.id||`new-${index}`} className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
      <label className="mb-3 flex aspect-[16/9] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-black/20">{item.image_url?<img src={item.image_url} alt={item.name} className="h-full w-full object-cover"/>:<span className="inline-flex items-center gap-2 text-sm text-zinc-400"><ImagePlus size={18}/>Imagen categoría</span>}<input type="file" accept="image/*" className="hidden" onChange={async(e)=>{const file=e.target.files?.[0];if(!file)return;try{patch(index,"image_url",await upload(file))}catch(error){alert(error instanceof Error?error.message:"No se pudo subir")}}}/></label>
      <div className="space-y-2"><input className="input-admin" placeholder="Nombre" value={item.name} onChange={(e)=>{patch(index,"name",e.target.value); if(!item.id) patch(index,"slug",slugify(e.target.value));}}/><input className="input-admin" placeholder="slug" value={item.slug} onChange={(e)=>patch(index,"slug",slugify(e.target.value))}/><input className="input-admin" type="number" value={item.sort_order} onChange={(e)=>patch(index,"sort_order",Number(e.target.value))}/></div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-300"><label className="flex items-center gap-2"><input type="checkbox" checked={item.is_active} onChange={(e)=>patch(index,"is_active",e.target.checked)}/>Activa</label><label className="flex items-center gap-2"><input type="checkbox" checked={item.show_home} onChange={(e)=>patch(index,"show_home",e.target.checked)}/>Mostrar en home</label></div>
      <div className="mt-4 flex justify-end gap-2"><button onClick={()=>remove(item,index)} className="rounded-xl bg-red-500/10 p-2.5 text-red-300"><Trash2 size={16}/></button><button onClick={()=>save(item)} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-black"><Save size={16}/>Guardar</button></div>
    </section>)}{!items.length&&<p className="text-zinc-400">No hay categorías.</p>}</div>}
  </div></main>;
}
