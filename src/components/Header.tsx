import { FormEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  MapPin,
  Menu,
  Search,
  ShieldCheck,
  ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import CartDrawer from "./CartDrawer";
import GoalkeeperCartAnimation from "./GoalkeeperCartAnimation";
import { supabase } from "../lib/supabase";

type NavLinkItem = {
  label: string;
  href: string;
  accent?: boolean;
  dropdown?: boolean;
};

const fallbackCategoryLinks: NavLinkItem[] = [
  { label: "Guantes de arquero", href: "/guantes" },
  { label: "Chimpunes", href: "/zapatillas" },
  { label: "Protecciones", href: "/categoria/protecciones" },
  { label: "Ropa deportiva", href: "/ropa" },
  { label: "Accesorios", href: "/accesorios" },
];

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [categoryLinks, setCategoryLinks] = useState<NavLinkItem[]>(
    fallbackCategoryLinks,
  );

  useEffect(() => {
    supabase
      .from("categories")
      .select("name,slug")
      .eq("is_active", true)
      .neq("slug", "ofertas")
      .order("sort_order")
      .then(({ data, error }) => {
        if (!error && data?.length) {
          setCategoryLinks(
            data.slice(0, 6).map((row: any) => ({
              label:
                (
                  {
                    guantes: "Guantes de arquero",
                    zapatillas: "Chimpunes",
                    protecciones: "Protecciones",
                    ropa: "Ropa deportiva",
                    accesorios: "Accesorios",
                  } as Record<string, string>
                )[row.slug] || row.name,
              href: ["guantes", "zapatillas", "ropa", "accesorios"].includes(
                row.slug,
              )
                ? `/${row.slug}`
                : `/categoria/${row.slug}`,
            })),
          );
        }
      });
  }, []);

  const navLinks: NavLinkItem[] = [
    { label: "Inicio", href: "/" },
    { label: "Ofertas", href: "/ofertas", accent: true },
    ...categoryLinks,
    { label: "Blog", href: "/blog" },
    { label: "Marcas", href: "/marcas" },
    { label: "Contacto", href: "/contacto" },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const { user, fullName } = useAuth();
  const { totalItems } = useCart();

  const go = (href: string) => {
    setMobileOpen(false);
    navigate(href);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();

    const query = searchValue.trim();

    onSearch(query);

    if (location.pathname !== "/") {
      navigate("/");
    }

    setTimeout(() => {
      document
        .getElementById("productos")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#090a0b] text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
        {/* TOP BAR */}
        <div className="hidden border-b border-white/10 bg-[#0d0e10] lg:block">
          <div className="padel-container flex h-9 items-center justify-between text-[10px] font-semibold text-white/70">
            <div className="flex items-center gap-7">
              <div className="flex items-center gap-2">
                <Truck size={14} className="text-[#e3262e]" />
                <span>Envíos a todo el Perú</span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#e3262e]" />
                <span>Productos 100% originales</span>
              </div>
            </div>

            <div className="flex items-center gap-7">
              <span>¿Necesitas ayuda? +51 993 834 954</span>

              <button
                onClick={() => go("/contacto")}
                className="flex items-center gap-2 transition hover:text-white"
              >
                <MapPin size={14} className="text-[#e3262e]" />
                Contáctanos
              </button>
            </div>
          </div>
        </div>

        {/* MAIN HEADER */}
        <div className="padel-container flex h-[82px] items-center gap-4 sm:gap-5 lg:h-[108px] lg:gap-10">
          {/* LOGO */}
          <Link
            to="/"
            className="
    flex shrink-0 items-center
    lg:w-[12rem]
    xl:w-[12rem]
  "
            aria-label="The House of Sports"
          >
            <img
              src={logo}
              alt="The House of Sports"
              className="
      h-auto
      w-28
      object-contain
      sm:w-36

      lg:w-[9rem]
      lg:origin-left
      lg:scale-[1.45]

      xl:scale-[1.55]
    "
            />
          </Link>

          {/* DESKTOP SEARCH */}
          <form
            onSubmit={submit}
            className="mx-auto hidden w-full max-w-[670px] lg:block"
          >
            <div className="flex h-12 items-center rounded-[5px] border border-white/10 bg-white/[0.055] px-5 transition focus-within:border-[#e3262e]/70 focus-within:bg-white/[0.08]">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar productos, marcas o categorías..."
                className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/45"
              />

              <button
                type="submit"
                aria-label="Buscar"
                className="ml-3 text-white/80 transition hover:text-[#e3262e]"
              >
                <Search size={21} strokeWidth={1.7} />
              </button>
            </div>
          </form>

          {/* ACTIONS */}
          <div className="ml-auto flex items-center gap-2 sm:gap-4 lg:gap-7">
            {/* MOBILE SEARCH */}
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/90 lg:hidden"
              onClick={() => setMobileSearchOpen((v) => !v)}
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>

            {/* ACCOUNT */}
            <button
              onClick={() => navigate(user ? "/mi-cuenta" : "/login")}
              className="flex items-center gap-3 text-left transition hover:text-[#e3262e]"
            >
              <User size={25} strokeWidth={1.55} />

              <span className="hidden lg:block">
                <span className="block text-[12px] font-black leading-tight">
                  {user ? fullName || "Mi cuenta" : "Mi cuenta"}
                </span>

                <span className="mt-0.5 block text-[10px] text-white/50">
                  {user ? "Ver perfil" : "Iniciar sesión"}
                </span>
              </span>
            </button>

            {/* CART */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-3 transition hover:text-[#e3262e]"
              aria-label="Carrito"
              data-cart-target
            >
              <ShoppingCart size={25} strokeWidth={1.55} />

              <span className="hidden lg:block">
                <span className="block text-[12px] font-black">Carrito</span>

                <span className="mt-0.5 block text-[10px] text-white/50">
                  {totalItems} producto
                  {totalItems === 1 ? "" : "s"}
                </span>
              </span>

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[#e3262e] px-1 text-[10px] font-black text-white lg:-right-4 lg:-top-1">
                  {totalItems}
                </span>
              )}
            </button>

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/10 lg:hidden"
              aria-label="Menú"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* MOBILE SEARCH */}
        {mobileSearchOpen && (
          <form
            onSubmit={submit}
            className="border-t border-white/10 px-5 py-3 lg:hidden"
          >
            <div className="flex h-11 items-center rounded-md border border-white/10 bg-white/[0.06] px-4">
              <input
                autoFocus
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Buscar productos..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
              />

              <Search size={18} />
            </div>
          </form>
        )}

        {/* DESKTOP NAV */}
        <nav className="hidden border-t border-white/[0.06] bg-[#0b0c0d] lg:block">
          <div className="padel-container flex h-[50px] items-center justify-center gap-4 xl:gap-7">
            {navLinks.map((link) => {
              const active = location.pathname === link.href;

              return (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className={`flex h-full items-center gap-1.5 border-b-2 text-[10px] font-black xl:text-[11px] uppercase tracking-[0.02em] transition ${
                    active
                      ? "border-[#e3262e] text-[#e3262e]"
                      : link.accent
                        ? "border-transparent text-[#e3262e] hover:border-[#e3262e]"
                        : "border-transparent text-white/85 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {link.label}

                  {link.dropdown && <ChevronDown size={13} strokeWidth={1.8} />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#0b0c0d] lg:hidden">
            <div className="grid grid-cols-2 gap-2 px-5 py-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => go(link.href)}
                  className={`rounded-md border px-4 py-3 text-left text-[11px] font-black uppercase ${
                    link.accent
                      ? "border-[#e3262e]/30 bg-[#e3262e]/10 text-[#e3262e]"
                      : "border-white/10 bg-white/[0.03] text-white/85"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <GoalkeeperCartAnimation />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
