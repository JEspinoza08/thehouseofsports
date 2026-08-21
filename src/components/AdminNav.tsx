import {
  BarChart3,
  BookOpenText,
  Boxes,
  ChevronDown,
  Image,
  Layers3,
  Menu,
  Package,
  PackagePlus,
  Settings2,
  Store,
  Trophy,
  Users,
  X,
} from "lucide-react";
import logo from "../assets/logo.png";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

const items = [
  { to: "/admin", label: "Resumen", icon: BarChart3, end: true },
  { to: "/admin/products", label: "Productos", icon: Boxes },
  { to: "/admin/combos", label: "Combos", icon: PackagePlus },
  { to: "/admin/orders", label: "Pedidos", icon: Package },
  { to: "/admin/manual-sales", label: "Venta presencial", icon: Store },
  { to: "/admin/users", label: "Clientes / empleados", icon: Users },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/categories", label: "Categorías", icon: Layers3 },
  { to: "/admin/blog", label: "Blog", icon: BookOpenText },
  { to: "/admin/athletes", label: "Atletas", icon: Trophy },
  { to: "/admin/settings", label: "Configuración", icon: Settings2 },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="space-y-1.5">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-black transition ${
              isActive
                ? "bg-[#e3262e] text-white shadow-[0_8px_24px_rgba(227,38,46,.18)]"
                : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
            }`
          }
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] group-hover:bg-white/[0.08]">
            <Icon size={17} />
          </span>
          <span className="min-w-0 truncate">{label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function AdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* ERP-style sidebar on desktop: always visible, no horizontal scrolling. */}
      <aside className="fixed bottom-5 left-5 top-5 z-50 hidden w-56 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111214]/95 shadow-2xl backdrop-blur-xl xl:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            {/* LOGO */}
<Link
  to="/admin"
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
      w-34
      object-contain
    "
  />
</Link>
            
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
          <NavItems />
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-500">Administración THS</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">Catálogo, pedidos, ventas y contenido en un solo lugar.</p>
          </div>
        </div>
      </aside>

      {/* Compact menu for tablets/mobile. It expands vertically instead of scrolling sideways. */}
      <nav className="mb-6 rounded-2xl border border-white/10 bg-zinc-900/90 p-2 xl:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left"
          aria-expanded={open}
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e3262e] text-white">
              <Menu size={18} />
            </span>
            <span>
              <span className="block text-xs font-black uppercase tracking-[.16em] text-[#e3262e]">THS Admin</span>
              <span className="block text-sm font-black text-white">Menú de gestión</span>
            </span>
          </span>
          {open ? <X size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
        </button>

        {open && (
          <div className="mt-2 border-t border-white/10 px-1 pb-1 pt-3">
            <NavItems onNavigate={() => setOpen(false)} />
          </div>
        )}
      </nav>
    </>
  );
}
