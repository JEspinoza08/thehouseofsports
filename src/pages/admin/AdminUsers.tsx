import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import AdminNav from "../../components/AdminNav";
import { supabase } from "../../lib/supabase";

type ManagedUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at?: string | null;
  last_sign_in_at?: string | null;
};

type RoleFilter = "" | "admin";

export default function AdminUsers() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("user");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "" });

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error: invokeError } = await supabase.functions.invoke("admin-users", { body });
    if (invokeError) throw invokeError;
    if (!data?.ok) throw new Error(data?.error || "No se pudo completar la operación");
    return data;
  };

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await invoke({ action: "list" });
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users
      .filter((u) => u.role === roleFilter)
      .filter((u) => !needle || `${u.full_name} ${u.email} ${u.phone}`.toLowerCase().includes(needle));
  }, [users, query, roleFilter]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await invoke({
        action: "create",
        role: roleFilter,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        password: form.password || undefined,
      });
      setMessage(
        `${roleFilter === "admin" ? "Empleado admin" : "Cliente"} creado correctamente. Contraseña inicial: ${data.temporary_password}`,
      );
      setForm({ full_name: "", email: "", phone: "", password: "" });
      setShowCreate(false);
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: ManagedUser) => {
    const next = !user.is_active;
    const confirmed = window.confirm(
      next
        ? `¿Reactivar a ${user.full_name || user.email}?`
        : `¿Dar de baja a ${user.full_name || user.email}? No podrá iniciar sesión hasta ser reactivado.`,
    );
    if (!confirmed) return;

    setError("");
    setMessage("");
    try {
      await invoke({ action: "set_active", user_id: user.id, is_active: next });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
      setMessage(next ? "Usuario reactivado correctamente." : "Usuario dado de baja correctamente.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el usuario");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white xl:pl-[15.5rem]">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e3262e]">The House of Sports</p>
          <h1 className="mt-2 text-3xl font-black">Clientes y empleados</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Administra las cuentas de clientes y el personal con acceso al panel administrativo.
          </p>
        </div>

        <AdminNav />

        {message && <div className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">{message}</div>}
        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-bold text-red-300">{error}</div>}

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="inline-flex rounded-xl border border-white/10 bg-zinc-950 p-1">
              <button
                onClick={() => setRoleFilter("user")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${roleFilter === "user" ? "bg-[#e3262e] text-white" : "text-zinc-400"}`}
              >
                <Users size={16} /> Clientes
              </button>
              <button
                onClick={() => setRoleFilter("admin")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${roleFilter === "admin" ? "bg-[#e3262e] text-white" : "text-zinc-400"}`}
              >
                <ShieldCheck size={16} /> Empleados admin
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-[260px]">
                <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar nombre, correo o teléfono..."
                  className="w-full rounded-xl border border-white/10 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#e3262e]"
                />
              </div>
              <button
                onClick={() => setShowCreate((v) => !v)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e3262e] px-4 py-2.5 text-sm font-black"
              >
                <Plus size={17} /> Crear {roleFilter === "admin" ? "empleado" : "cliente"}
              </button>
            </div>
          </div>

          {showCreate && (
            <form onSubmit={createUser} className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-zinc-950 p-4 md:grid-cols-2 xl:grid-cols-4">
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Nombre completo"
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="correo@cliente.com"
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Teléfono (opcional)"
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
              <input
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Contraseña opcional"
                className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
              <div className="md:col-span-2 xl:col-span-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  Si dejas la contraseña vacía, se generará usando el correo sin el símbolo @.
                </p>
                <button disabled={saving} className="rounded-xl bg-white px-5 py-2.5 text-sm font-black text-zinc-950 disabled:opacity-50">
                  {saving ? "Creando..." : "Guardar usuario"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-3">Usuario</th>
                  <th className="px-3 py-3">Contacto</th>
                  <th className="px-3 py-3">Alta</th>
                  <th className="px-3 py-3">Último acceso</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-zinc-500">Cargando usuarios...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-10 text-center text-zinc-500">No hay usuarios para mostrar.</td></tr>
                ) : filtered.map((user) => (
                  <tr key={user.id} className="border-b border-white/5">
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5"><UserRound size={18} /></div>
                        <div><p className="font-black">{user.full_name || "Sin nombre"}</p><p className="mt-1 text-xs text-zinc-500">{user.role === "admin" ? "Administrador" : "Cliente"}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-4"><p className="flex items-center gap-2"><Mail size={13} className="text-zinc-500" />{user.email}</p>{user.phone && <p className="mt-2 flex items-center gap-2 text-xs text-zinc-500"><Phone size={13}/>{user.phone}</p>}</td>
                    <td className="px-3 py-4 text-zinc-400">{user.created_at ? new Date(user.created_at).toLocaleDateString("es-PE") : "—"}</td>
                    <td className="px-3 py-4 text-zinc-400">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("es-PE") : "Nunca"}</td>
                    <td className="px-3 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${user.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{user.is_active ? "Activo" : "Baja"}</span></td>
                    <td className="px-3 py-4 text-right">
                      <button
                        onClick={() => toggleActive(user)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black ${user.is_active ? "border-red-500/30 text-red-300 hover:bg-red-500/10" : "border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"}`}
                      >
                        {user.is_active ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                        {user.is_active ? "Dar de baja" : "Reactivar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
