import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    navigate("/");
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200 p-8"
      >
        <h1 className="text-3xl font-black text-neutral-950 text-center">
          Iniciar sesión
        </h1>

        <p className="mt-2 text-center text-sm text-neutral-500">
          Ingresa a tu cuenta de The House of Sports
        </p>

        <label className="block mt-8 mb-2 text-sm font-bold">Correo</label>
        <div className="relative">
          <Mail className="absolute left-4 top-3.5 text-neutral-400" size={18} />
          <input
            type="email"
            className="w-full rounded-xl border border-neutral-200 py-3 pl-11 pr-4 outline-none focus:border-[#e3262e]"
            placeholder="cliente@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <label className="block mt-5 mb-2 text-sm font-bold">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-4 top-3.5 text-neutral-400" size={18} />
          <input
            type="password"
            className="w-full rounded-xl border border-neutral-200 py-3 pl-11 pr-4 outline-none focus:border-[#e3262e]"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        <button
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-[#e3262e] py-3 font-black text-white transition hover:bg-[#d94027] disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <p className="mt-6 text-center text-sm text-neutral-600">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-bold text-[#e3262e]">
            Crear cuenta
          </Link>
        </p>
      </form>
    </main>
  );
}