import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    try {
      const { data: emailData, error: emailError } =
        await supabase.functions.invoke("send-welcome-email", {
          body: {
            fullName,
            email,
          },
        });

      if (emailError) {
        console.error(
          "La cuenta se creó, pero el correo no se pudo enviar:",
          emailError,
        );
      } else {
        console.log("Correo de bienvenida enviado:", emailData);
      }
    } catch (emailError) {
      console.error("Error ejecutando send-welcome-email:", emailError);
    }

    setLoading(false);
    navigate("/mi-cuenta");
  };

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-neutral-200 p-8"
      >
        <h1 className="text-3xl font-black text-neutral-950 text-center">
          Crear cuenta
        </h1>

        <p className="mt-2 text-center text-sm text-neutral-500">
          Regístrate para comprar más rápido
        </p>

        <label className="block mt-8 mb-2 text-sm font-bold">Nombre</label>
        <div className="relative">
          <User
            className="absolute left-4 top-3.5 text-neutral-400"
            size={18}
          />
          <input
            className="w-full rounded-xl border border-neutral-200 py-3 pl-11 pr-4 outline-none focus:border-[#e3262e]"
            placeholder="Tu nombre"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <label className="block mt-5 mb-2 text-sm font-bold">Correo</label>
        <div className="relative">
          <Mail
            className="absolute left-4 top-3.5 text-neutral-400"
            size={18}
          />
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
          <Lock
            className="absolute left-4 top-3.5 text-neutral-400"
            size={18}
          />
          <input
            type="password"
            minLength={6}
            className="w-full rounded-xl border border-neutral-200 py-3 pl-11 pr-4 outline-none focus:border-[#e3262e]"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {errorMsg && <p className="mt-4 text-sm text-red-500">{errorMsg}</p>}

        <button
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-[#e3262e] py-3 font-black text-white transition hover:bg-[#d94027] disabled:opacity-60"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>

        <p className="mt-6 text-center text-sm text-neutral-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-bold text-[#e3262e]">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </main>
  );
}
