import { useState } from "react";
import { MessageCircle, Mail, Clock, Send } from "lucide-react";
import { WHATSAPP_NUMBER } from "../data/products";
export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Hola The House of Sports, soy ${form.name}. Correo: ${form.email}. Asunto: ${form.subject}. ${form.message}`;
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      "_blank",
    );
  };
  return (
    <section id="contacto" className="bg-white py-14 lg:py-20">
      <div className="padel-container">
        <div className="mb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#e3262e]">
            Contáctanos
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase lg:text-4xl">
            Estamos para ayudarte
          </h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="space-y-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5 hover:border-[#e3262e]"
            >
              <MessageCircle className="text-[#e3262e]" />
              <div>
                <h3 className="font-black uppercase">WhatsApp</h3>
                <p className="text-sm text-neutral-500">+51 993834954</p>
              </div>
            </a>
            <div className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
              <Mail className="text-[#e3262e]" />
              <div>
                <h3 className="font-black uppercase">Email</h3>
                <p className="text-sm text-neutral-500">admi.ths.pe@gmail.com</p>
              </div>
            </div>
            <div className="flex gap-4 rounded-2xl border border-neutral-200 bg-white p-5">
              <Clock className="text-[#e3262e]" />
              <div>
                <h3 className="font-black uppercase">Horario</h3>
                <p className="text-sm text-neutral-500">
                  Lunes a Domingos: 7:00 am - 11:00 pm
                </p>
              </div>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                required
                placeholder="Nombre completo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
              <input
                required
                placeholder="Correo electrónico"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#e3262e]"
              />
            </div>
            <input
              required
              placeholder="Asunto"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="mt-4 w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#e3262e]"
            />
            <textarea
              required
              placeholder="Mensaje"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="mt-4 w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#e3262e]"
            />
            <button className="padel-btn mt-4 gap-2">
              <Send size={16} /> Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
