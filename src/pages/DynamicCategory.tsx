import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import CatalogPage from "./CatalogPage";
import { supabase } from "../lib/supabase";

export default function DynamicCategory() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const brand = searchParams.get("brand") || "";
  const [name,setName]=useState(slug.replace(/-/g," "));
  useEffect(()=>{ supabase.from("categories").select("name").eq("slug",slug).maybeSingle().then(({data})=>{if(data?.name)setName(data.name)}); },[slug]);
  const title = slug === "rodilleras" ? "Protecciones" : name;
  const subtitle = slug === "rodilleras" ? "Descubre 181 KEEPERS: protecciones de alto rendimiento diseñadas para brindar seguridad, comodidad y libertad de movimiento." : `Explora todos los productos de ${name} disponibles en The House of Sports.`;
  return <CatalogPage title={brand ? `${title} ${brand}` : title} subtitle={subtitle} category={slug} selectedBrand={brand}/>;
}
