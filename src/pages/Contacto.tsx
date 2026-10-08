import Header from "../components/Header";
import Contact from "../components/Contact";
import Trust from "../components/Trust";
import Footer from "../components/Footer";

export default function Contacto() {
  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={() => {}} />

      <section className="pt-24 pb-12 px-6 bg-neutral-50 text-neutral-950">
        <div className="max-w-7xl mx-auto">
          <span className="text-[#e3262e] font-bold uppercase text-sm">
            Atención personalizada
          </span>
          <h1 className="mt-3 text-4xl md:text-5xl font-black uppercase tracking-tight">
            Contacto
          </h1>
          <p className="mt-4 max-w-2xl text-neutral-950/70 text-lg">
            Escríbenos por WhatsApp y recibe asesoría para elegir el mejor producto.
          </p>
        </div>
      </section>

      <Contact />
      <Trust />
      <Footer />
    </div>
  );
}