import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/forms/ContactForm";
import ContactInfo from "@/components/contacto/ContactInfo";
import MapaCobertura from "@/components/MapaCobertura";
import { ANILLO, PEDANIAS, RADIO_50, RADIO_KM } from "@/lib/coverage";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta con Neotérmica: formulario o info@neotermica.es. Climatización en Murcia y unos 50 km a la redonda. Presupuesto sin compromiso.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto | Neotérmica",
    description:
      "Formulario, email y zona de servicio de Neotérmica Climatización en Murcia.",
    url: "/contacto",
    type: "website",
    locale: "es_ES",
    siteName: "Neotérmica",
  },
};

export default function ContactoPage() {
  return (
    <>
      <header className="pb-8 pt-[calc(74px+4.5rem)]">
        <div className="container-site">
          <p className="eyebrow">Hablemos</p>
          <h1 className="mb-4 text-[clamp(2rem,4.5vw,3.2rem)]">Puedes contactarnos</h1>
          <p className="lead">
            Cuéntanos qué necesitas y te damos una respuesta clara: si hace falta
            visita o qué presupuesto tiene sentido.
          </p>
        </div>
      </header>

      <section className="pb-16">
        <div className="container-site">
          <aside className="mb-10 flex flex-col gap-5 rounded-[20px] border border-line bg-soft p-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-7">
            <div className="min-w-0">
              <p className="eyebrow">Oferta de empleo</p>
              <p className="mb-2 font-display text-[1.2rem] font-bold">
                ¿Quieres trabajar con nosotros?
              </p>
              <p className="text-[0.95rem] text-mutedink">
                Este formulario es para clientes: presupuesto e instalación. Si
                buscas empleo, rellena el otro, el específico de la oferta
                (formación, experiencia y edad).
              </p>
            </div>
            <Link
              href="/oferta-empleo#formulario"
              className="btn-primary shrink-0 self-start sm:self-center"
            >
              Ir al formulario de empleo
            </Link>
          </aside>

          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <ContactInfo />
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      <section id="donde-trabajamos" className="scroll-mt-28 bg-soft py-16">
        <div className="container-site">
          <p className="eyebrow">Zona de servicio</p>
          <h2 className="h-sec">Dónde trabajamos</h2>
          <p className="lead mb-8">
            Murcia capital y sus pedanías ({PEDANIAS.join(", ")}), el área metropolitana
            ({ANILLO.join(", ")}) y un radio de unos {RADIO_KM} km:{" "}
            {RADIO_50.join(", ")}… Si estás más lejos, pregúntanos. El mapa marca la
            zona de servicio, no un local: trabajamos a pie de obra.
          </p>
          <MapaCobertura />
        </div>
      </section>
    </>
  );
}
