import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, Printer } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

type ClaimType = "reclamo" | "queja";
type ProductType = "producto" | "servicio";

type FormState = {
  fullName: string;
  documentType: "DNI" | "CE" | "Pasaporte";
  documentNumber: string;
  address: string;
  department: string;
  province: string;
  district: string;
  email: string;
  phone: string;
  isMinor: boolean;
  guardianName: string;
  productType: ProductType;
  orderNumber: string;
  productDescription: string;
  amount: string;
  claimType: ClaimType;
  detail: string;
  request: string;
  accepted: boolean;
};

const initialForm: FormState = {
  fullName: "",
  documentType: "DNI",
  documentNumber: "",
  address: "",
  department: "",
  province: "",
  district: "",
  email: "",
  phone: "",
  isMinor: false,
  guardianName: "",
  productType: "producto",
  orderNumber: "",
  productDescription: "",
  amount: "",
  claimType: "reclamo",
  detail: "",
  request: "",
  accepted: false,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#e3262e] focus:ring-4 focus:ring-[#e3262e]/10";

const labelClass = "text-sm font-extrabold text-neutral-800";

function createClaimCode() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = crypto.randomUUID().split("-")[0].toUpperCase();
  return `LR-${date}-${random}`;
}

export default function ClaimsBook() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [claimCode, setClaimCode] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");

  useEffect(() => {
    document.title = "Libro de Reclamaciones | The House of Sports Perú";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const maxDocumentLength = useMemo(
    () => (form.documentType === "DNI" ? 8 : 12),
    [form.documentType],
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Ingresa tus nombres y apellidos.";
    if (!form.documentNumber.trim()) return "Ingresa tu número de documento.";
    if (form.documentType === "DNI" && !/^\d{8}$/.test(form.documentNumber)) {
      return "El DNI debe contener 8 dígitos.";
    }
    if (!form.address.trim() || !form.department.trim() || !form.province.trim() || !form.district.trim()) {
      return "Completa tu domicilio, departamento, provincia y distrito.";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Ingresa un correo electrónico válido.";
    if (!/^\d{9}$/.test(form.phone)) return "El celular debe contener 9 dígitos.";
    if (form.isMinor && !form.guardianName.trim()) return "Ingresa el nombre del padre, madre o representante.";
    if (!form.productDescription.trim()) return "Describe el producto o servicio contratado.";
    if (!form.detail.trim()) return "Describe el detalle de tu reclamo o queja.";
    if (!form.request.trim()) return "Indica qué solución solicitas.";
    if (!form.accepted) return "Debes confirmar que la información registrada es verdadera.";
    return "";
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const code = createClaimCode();
    const timestamp = new Date().toISOString();

    const { error: insertError } = await supabase.from("claims_book").insert({
      claim_code: code,
      consumer_name: form.fullName.trim(),
      document_type: form.documentType,
      document_number: form.documentNumber.trim(),
      consumer_address: form.address.trim(),
      department: form.department.trim(),
      province: form.province.trim(),
      district: form.district.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      is_minor: form.isMinor,
      guardian_name: form.isMinor ? form.guardianName.trim() : null,
      contracted_item_type: form.productType,
      order_number: form.orderNumber.trim() || null,
      contracted_item_description: form.productDescription.trim(),
      claimed_amount: form.amount ? Number(form.amount) : null,
      claim_type: form.claimType,
      claim_detail: form.detail.trim(),
      consumer_request: form.request.trim(),
      accepted_declaration: true,
      status: "pendiente",
      created_at: timestamp,
    });

    setSubmitting(false);

    if (insertError) {
      console.error("Error registrando reclamo:", insertError);
      setError("No pudimos registrar tu solicitud. Verifica tu conexión e inténtalo nuevamente.");
      return;
    }

    setClaimCode(code);
    setSubmittedAt(timestamp);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setForm(initialForm);
    setClaimCode("");
    setSubmittedAt("");
    setError("");
  };

  if (claimCode) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-950">
        <Header onSearch={() => {}} />
        <main className="px-6 pb-16 pt-32">
          <section className="padel-container mx-auto max-w-3xl rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-xl md:p-12 print:shadow-none">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={34} />
            </div>
            <p className="mt-7 text-xs font-black uppercase tracking-[0.2em] text-[#e3262e]">Registro completado</p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] md:text-5xl">Hoja de reclamación registrada</h1>
            <p className="mt-5 leading-7 text-neutral-600">
              Conserva este código como constancia. The House of Sports Perú responderá al correo registrado dentro del plazo máximo legal de 15 días hábiles.
            </p>

            <div className="mt-8 rounded-3xl bg-neutral-950 p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/50">Código de seguimiento</p>
              <p className="mt-2 break-all text-2xl font-black tracking-tight md:text-3xl">{claimCode}</p>
              <p className="mt-3 text-sm text-white/60">
                Registrado el {new Date(submittedAt).toLocaleString("es-PE", { dateStyle: "long", timeStyle: "short" })}
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-3xl border border-neutral-200 p-6 text-sm md:grid-cols-2">
              <div><strong>Consumidor:</strong><br />{form.fullName}</div>
              <div><strong>Documento:</strong><br />{form.documentType} {form.documentNumber}</div>
              <div><strong>Tipo:</strong><br />{form.claimType === "reclamo" ? "Reclamo" : "Queja"}</div>
              <div><strong>Producto/servicio:</strong><br />{form.productDescription}</div>
              <div className="md:col-span-2"><strong>Detalle:</strong><br />{form.detail}</div>
              <div className="md:col-span-2"><strong>Pedido del consumidor:</strong><br />{form.request}</div>
            </div>

            <p className="mt-6 text-xs leading-5 text-neutral-500">
              La presentación de esta hoja no constituye una denuncia ante Indecopi ni impide que el consumidor utilice otras vías de solución de controversias.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row print:hidden">
              <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neutral-950 px-6 py-3 font-black text-white hover:bg-neutral-800">
                <Printer size={18} /> Imprimir constancia
              </button>
              <button onClick={resetForm} className="rounded-2xl border border-neutral-300 px-6 py-3 font-black text-neutral-800 hover:bg-neutral-50">
                Registrar otra solicitud
              </button>
            </div>
          </section>
        </main>
        <div className="print:hidden"><Footer /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <Header onSearch={() => {}} />

      <main>
        <section className="bg-neutral-950 px-6 pb-14 pt-28 text-white lg:pb-20">
          <div className="padel-container">
            <div className="max-w-4xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e3262e] shadow-lg shadow-[#e3262e]/20">
                <FileText size={28} />
              </div>
              <p className="mt-6 text-xs font-black uppercase tracking-[0.22em] text-[#e3262e]">Atención al consumidor</p>
              <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.05em] md:text-6xl">Libro de Reclamaciones</h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70 md:text-lg">
                Registra aquí una queja o reclamo relacionado con tu compra o con la atención recibida en The House of Sports Perú.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-12 lg:py-16">
          <div className="padel-container mx-auto max-w-5xl">
            <div className="mb-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black uppercase">Identificación del proveedor</h2>
              <div className="mt-4 grid gap-3 text-sm leading-6 text-neutral-700 md:grid-cols-2">
                <p><strong>Razón social:</strong> The House of Sports Perú</p>
                <p><strong>RUC:</strong> 10422446503</p>
                <p><strong>Domicilio:</strong> Ate, Peru, 15011</p>
                <p><strong>Correo:</strong> admi.ths.pe@gmail.com</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <FormSection number="1" title="Identificación del consumidor">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nombres y apellidos *" className="md:col-span-2">
                    <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} maxLength={120} />
                  </Field>
                  <Field label="Tipo de documento *">
                    <select className={inputClass} value={form.documentType} onChange={(e) => update("documentType", e.target.value as FormState["documentType"])}>
                      <option>DNI</option><option>CE</option><option>Pasaporte</option>
                    </select>
                  </Field>
                  <Field label="Número de documento *">
                    <input className={inputClass} inputMode="numeric" value={form.documentNumber} onChange={(e) => update("documentNumber", e.target.value.replace(/\D/g, "").slice(0, maxDocumentLength))} />
                  </Field>
                  <Field label="Domicilio *" className="md:col-span-2">
                    <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} maxLength={180} />
                  </Field>
                  <Field label="Departamento *"><input className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)} /></Field>
                  <Field label="Provincia *"><input className={inputClass} value={form.province} onChange={(e) => update("province", e.target.value)} /></Field>
                  <Field label="Distrito *"><input className={inputClass} value={form.district} onChange={(e) => update("district", e.target.value)} /></Field>
                  <Field label="Celular *"><input className={inputClass} inputMode="numeric" value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 9))} /></Field>
                  <Field label="Correo electrónico *" className="md:col-span-2"><input type="email" className={inputClass} value={form.email} onChange={(e) => update("email", e.target.value)} /></Field>
                </div>
                <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm font-bold text-neutral-700">
                  <input type="checkbox" className="h-5 w-5 accent-[#e3262e]" checked={form.isMinor} onChange={(e) => update("isMinor", e.target.checked)} />
                  El consumidor es menor de edad
                </label>
                {form.isMinor && <Field label="Nombre del padre, madre o representante *" className="mt-5"><input className={inputClass} value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)} /></Field>}
              </FormSection>

              <FormSection number="2" title="Identificación del bien contratado">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Tipo *">
                    <select className={inputClass} value={form.productType} onChange={(e) => update("productType", e.target.value as ProductType)}><option value="producto">Producto</option><option value="servicio">Servicio</option></select>
                  </Field>
                  <Field label="Número de pedido o comprobante"><input className={inputClass} value={form.orderNumber} onChange={(e) => update("orderNumber", e.target.value)} maxLength={80} /></Field>
                  <Field label="Producto o servicio contratado *" className="md:col-span-2"><input className={inputClass} value={form.productDescription} onChange={(e) => update("productDescription", e.target.value)} maxLength={200} /></Field>
                  <Field label="Monto reclamado (S/)"><input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={(e) => update("amount", e.target.value)} /></Field>
                </div>
              </FormSection>

              <FormSection number="3" title="Detalle de la reclamación y pedido">
                <div className="grid gap-5">
                  <Field label="Tipo de solicitud *">
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <Choice active={form.claimType === "reclamo"} title="Reclamo" description="Disconformidad relacionada con un producto o servicio." onClick={() => update("claimType", "reclamo")} />
                      <Choice active={form.claimType === "queja"} title="Queja" description="Malestar o descontento respecto de la atención recibida." onClick={() => update("claimType", "queja")} />
                    </div>
                  </Field>
                  <Field label="Detalle del reclamo o queja *"><textarea className={`${inputClass} min-h-36 resize-y`} value={form.detail} onChange={(e) => update("detail", e.target.value)} maxLength={2000} /></Field>
                  <Field label="Pedido concreto del consumidor *"><textarea className={`${inputClass} min-h-28 resize-y`} value={form.request} onChange={(e) => update("request", e.target.value)} maxLength={1000} /></Field>
                </div>
              </FormSection>

              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
                <p className="text-sm leading-6 text-neutral-600">
                  The House of Sports Perú responderá el reclamo o queja en un plazo máximo de 15 días hábiles mediante el correo electrónico registrado. La presentación de esta hoja no constituye una denuncia ante Indecopi.
                </p>
                <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-bold text-neutral-700">
                  <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#e3262e]" checked={form.accepted} onChange={(e) => update("accepted", e.target.checked)} />
                  Declaro que la información consignada es verdadera y autorizo su tratamiento para atender esta solicitud. *
                </label>
                {error && <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}
                <button type="submit" disabled={submitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#e3262e] px-6 py-4 font-black uppercase tracking-wide text-white transition hover:bg-[#d83e25] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
                  {submitting ? <><Loader2 className="animate-spin" size={19} /> Registrando...</> : "Enviar hoja de reclamación"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8"><div className="mb-7 flex items-center gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-950 font-black text-white">{number}</span><h2 className="text-xl font-black uppercase tracking-[-0.03em] md:text-2xl">{title}</h2></div>{children}</section>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className={labelClass}>{label}</span>{children}</label>;
}

function Choice({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition ${active ? "border-[#e3262e] bg-[#e3262e]/5 ring-2 ring-[#e3262e]/10" : "border-neutral-300 hover:border-neutral-400"}`}><span className="block font-black uppercase">{title}</span><span className="mt-1 block text-xs leading-5 text-neutral-600">{description}</span></button>;
}
