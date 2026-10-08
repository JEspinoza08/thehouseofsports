import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkExistingSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setCheckingSession(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,is_active")
        .eq("id", session.user.id)
        .single();

      setIsAdmin(profile?.role === "admin" && profile?.is_active !== false);
      setCheckingSession(false);
    };

    checkExistingSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const {
      data: loginData,
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError || !loginData.user) {
      setError("Correo o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,is_active")
      .eq("id", loginData.user.id)
      .single();

    if (profileError || profile?.role !== "admin" || profile?.is_active === false) {
      await supabase.auth.signOut();

      setError(
        "Tu cuenta no tiene permisos para acceder al panel administrativo."
      );

      setLoading(false);
      return;
    }

    setLoading(false);
    navigate("/admin", { replace: true });
  };

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <p className="text-gray-400">Verificando sesión...</p>
      </main>
    );
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e3262e]/10 text-[#e3262e]">
            <Lock size={24} />
          </div>

          <h1 className="text-2xl font-black text-white">
            Panel administrativo
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Ingresa para administrar productos y stock.
          </p>
        </div>

        <label className="mb-2 block text-sm font-semibold text-white">
          Correo
        </label>

        <div className="relative mb-4">
          <Mail
            size={18}
            className="absolute left-3 top-3 text-gray-500"
          />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-white outline-none focus:border-[#e3262e]"
            placeholder="admin@cliente.com"
            required
          />
        </div>

        <label className="mb-2 block text-sm font-semibold text-white">
          Contraseña
        </label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white outline-none focus:border-[#e3262e]"
          placeholder="••••••••"
          required
        />

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[#e3262e] py-3 font-bold text-white transition-colors hover:bg-[#d83f20] disabled:opacity-60"
        >
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </form>
    </main>
  );
}